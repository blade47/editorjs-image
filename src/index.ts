/**
 * Image Tool for the Editor.js
 * @author CodeX <team@codex.so>
 * @license MIT
 * @see {@link https://github.com/editor-js/image}
 *
 * To developers.
 * To simplify Tool structure, we split it to 4 parts:
 *  1) index.ts — main Tool's interface, public API and methods for working with data
 *  2) uploader.ts — module that has methods for sending files via AJAX: from device, by URL or File pasting
 *  3) ui.ts — module for UI manipulations: render, showing preloader, etc
 *  4) tunes.js — working with Block Tunes: render buttons, handle clicks
 *
 * For debug purposes there is a testing server
 * that can save uploaded files and return a Response {@link UploadResponseFormat}
 *
 *       $ node dev/server.js
 *
 * It will expose 8008 port, so you can pass http://localhost:8008 with the Tools config:
 *
 * image: {
 *   class: ImageTool,
 *   config: {
 *     endpoints: {
 *       byFile: 'http://localhost:8008/uploadFile',
 *       byUrl: 'http://localhost:8008/fetchUrl',
 *     }
 *   },
 * },
 */

import type {
  API,
  ToolboxConfig,
  PasteConfig,
  BlockToolConstructorOptions,
  BlockTool,
  BlockAPI,
  PasteEvent,
  PatternPasteEventDetail,
  FilePasteEventDetail
} from '@editorjs/editorjs';
import './index.css';

import Ui from './ui';
import Uploader from './uploader';

import { IconPicture } from '@codexteam/icons';
import type {
  UploadResponseFormat,
  ImageToolData,
  ImageConfig,
  HTMLPasteEventDetailExtended,
  ImageSetterParam
} from './types/types';

/**
 * Constructor options for ImageTool, extending BlockToolConstructorOptions with image-specific configuration
 */
interface ImageToolConstructorOptions
  extends BlockToolConstructorOptions<ImageToolData, ImageConfig> {
  /**
   * User configuration for ImageTool
   */
  config: ImageConfig;
}

/**
 * Implementation of ImageTool class
 */
export default class ImageTool implements BlockTool {
  /**
   * Editor.js API instance
   */
  private api: API;

  /**
   * Flag indicating read-only mode
   */
  private readOnly: boolean;

  /**
   * Current Block API instance
   */
  private block: BlockAPI;

  /**
   * Configuration for the ImageTool
   */
  private config: ImageConfig;

  /**
   * Uploader module instance
   */
  private uploader: Uploader;

  /**
   * UI module instance
   */
  private ui: Ui;

  /**
   * Stores current block data internally
   */
  private _data: ImageToolData;

  /**
   * @param tool - tool properties got from editor.js
   * @param tool.data - previously saved data
   * @param tool.config - user config for Tool
   * @param tool.api - Editor.js API
   * @param tool.readOnly - read-only mode flag
   * @param tool.block - current Block API
   */
  constructor({
    data,
    config,
    api,
    readOnly,
    block,
  }: ImageToolConstructorOptions) {
    this.api = api;
    this.readOnly = readOnly;
    this.block = block;
    /**
     * Tool's initial config
     */
    this.config = {
      endpoints: config?.endpoints,
      additionalRequestData: config.additionalRequestData,
      additionalRequestHeaders: config.additionalRequestHeaders,
      types: config.types,
      field: config.field,
      captionPlaceholder: this.api.i18n.t(
        config.captionPlaceholder ?? 'Enter a caption'
      ),
      buttonContent: config.buttonContent,
      uploader: config.uploader,
      actions: config.actions,
      showCaption: !this.readOnly || this.isNotEmpty(data.caption),
    };

    /**
     * Module for file uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response: UploadResponseFormat) => this.onUpload(response),
      onError: (error: string) => this.uploadingFailed(error),
    });

    /**
     * Module for working with UI
     */
    this.ui = new Ui({
      api,
      config: this.config,
      onSelectFile: () => {
        this.uploader.uploadSelectedFile({
          onPreview: (src: string) => {
            this.ui.showPreloader(src);
          },
          onPreUpload: () => {
            this.ui.removeFileButton();
          },
        });
      },
      readOnly,
    });

    /**
     * Set saved state
     */
    this._data = {
      caption: '',
      height: data.height,
      width: data.width,
      file: {
        url: '',
      },
    };
    this.data = data;
  }

  /**
   * Notify core that read-only mode is supported
   */
  public static get isReadOnlySupported(): boolean {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   */
  public static get toolbox(): ToolboxConfig {
    return {
      icon: IconPicture,
      title: 'Image',
    };
  }

  /**
   * Renders Block content
   */
  public render(): HTMLDivElement {
    return this.ui.render(this.data) as HTMLDivElement;
  }

  /**
   * Validate data: check if Image exists
   * @param savedData — data received after saving
   * @returns false if saved data is not correct, otherwise true
   */
  public validate(savedData: ImageToolData): boolean {
    return !!savedData.file.url;
  }

  /**
   * Return Block data
   */
  public save(): ImageToolData {
    const caption = this.ui.nodes.caption;
    const image = this.ui.nodes.imageEl;

    this._data.caption = caption.textContent?.trim() ?? '';

    const currentWidth = image?.clientWidth ?? 0;
    const currentHeight = image?.clientHeight ?? 0;

    // Only update dimensions if BOTH are valid (> 0)
    // This prevents:
    // 1. Overwriting valid dimensions with 0
    // 2. Distorting aspect ratio by saving only one dimension
    if (currentWidth > 0 && currentHeight > 0) {
      this._data.width = String(currentWidth);
      this._data.height = String(currentHeight);
    }
    // else: keep existing dimensions (undefined for new images, old values for existing)

    return this.data;
  }

  /**
   * Fires after clicks on the Toolbox Image Icon
   * Initiates click on the Select File button
   */
  public appendCallback(): void {
    this.ui.nodes.fileButton.click();
  }

  /**
   * Clean up when block is removed
   */
  public destroy(): void {
    this.ui.destroy();
  }

  /**
   * Specify paste substitutes
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   */
  public static get pasteConfig(): PasteConfig {
    return {
      /**
       * Paste HTML into Editor
       */
      tags: [
        {
          img: { src: true },
        },
      ],
      /**
       * Paste URL of image into the Editor
       */
      patterns: {
        image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png|svg|webp)(\?[a-z0-9=]*)?$/i,
      },

      /**
       * Drag n drop file from into the Editor
       */
      files: {
        mimeTypes: ['image/*'],
      },
    };
  }

  /**
   * Specify paste handlers
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   * @param event - editor.js custom paste event
   *                              {@link https://github.com/codex-team/editor.js/blob/master/types/tools/paste-events.d.ts}
   */
  public onPaste(event: PasteEvent): void {
    switch (event.type) {
      case 'tag': {
        const image = (event.detail as HTMLPasteEventDetailExtended).data;

        /** Images from PDF */
        if (/^blob:/.test(image.src)) {
          void fetch(image.src)
            .then(response => response.blob())
            .then((file) => {
              this.uploadFile(file);
            });
          break;
        }

        this.uploadUrl(image.src);
        break;
      }
      case 'pattern': {
        const url = (event.detail as PatternPasteEventDetail).data;

        this.uploadUrl(url);
        break;
      }
      case 'file': {
        const file = (event.detail as FilePasteEventDetail).file;

        this.uploadFile(file);
        break;
      }
    }
  }

  /**
   * Private methods
   * ̿̿ ̿̿ ̿̿ ̿'̿'\̵͇̿̿\з= ( ▀ ͜͞ʖ▀) =ε/̵͇̿̿/’̿’̿ ̿ ̿̿ ̿̿ ̿̿
   */

  /**
   * Stores all Tool's data
   * @param data - data in Image Tool format
   */
  private set data(data: ImageToolData) {
    this._data.caption = data.caption || '';
    this._data.height = data.height;
    this._data.width = data.width;

    this.image = data.file;

    this.ui.fillCaption(this._data.caption);
  }

  /**
   * Return Tool data
   */
  private get data(): ImageToolData {
    return this._data;
  }

  /**
   * Set new image file
   * @param file - uploaded file data
   */
  private set image(file: ImageSetterParam | undefined) {
    this._data.file = file || { url: '' };

    if (file && file.url) {
      this.ui.fillImage(file.url, this.data.height, this.data.width);
    }
  }

  /**
   * File uploading callback
   * @param response - uploading server response
   */
  private onUpload(response: UploadResponseFormat): void {
    if (response.success && Boolean(response.file)) {
      this.image = response.file;
    } else {
      this.uploadingFailed('incorrect response: ' + JSON.stringify(response));
    }
  }

  /**
   * Handle uploader errors
   * @param errorText - uploading error info
   */
  private uploadingFailed(errorText: string): void {
    console.log('Image Tool: uploading failed because of', errorText);

    this.api.notifier.show({
      message: this.api.i18n.t('Couldn’t upload image. Please try another.'),
      style: 'error',
    });
    this.ui.hidePreloader();
    this.ui.addFileButton();
  }

  /**
   * Show preloader and upload image file
   * @param file - file that is currently uploading (from paste)
   */
  private uploadFile(file: Blob): void {
    this.uploader.uploadByFile(file, {
      onPreview: (src: string) => {
        this.ui.showPreloader(src);
      },
    });
  }

  /**
   * Show preloader and upload image by target url
   * @param url - url pasted
   */
  private uploadUrl(url: string): void {
    this.ui.showPreloader(url);
    this.uploader.uploadByUrl(url);
  }

  /**
   * Chack if string is empty
   * @param str - str string
   */
  private isNotEmpty(str: string): boolean {
    return str !== null && str !== undefined && str.trim() !== '';
  }
}
