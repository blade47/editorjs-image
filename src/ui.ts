import { IconPicture } from '@codexteam/icons';
import { make } from './utils/dom';
import type { API } from '@editorjs/editorjs';
import type { ImageToolData, ImageConfig } from './types/types';

/**
 * Enumeration representing the different states of the UI.
 */
enum UiState {
  /**
   * The UI is in an empty state, with no image loaded or being uploaded.
   */
  Empty = 'empty',

  /**
   * The UI is in an uploading state, indicating an image is currently being uploaded.
   */
  Uploading = 'uploading',

  /**
   * The UI is in a filled state, with an image successfully loaded.
   */
  Filled = 'filled',
}

/**
 * Nodes interface representing various elements in the UI.
 */
interface Nodes {
  /**
   * Wrapper element in the UI.
   */
  wrapper: HTMLElement;

  /**
   * Container for the image element in the UI.
   */
  imageContainer: HTMLElement;

  /**
   * Button for selecting files.
   */
  fileButton: HTMLElement;

  /**
   * Represents the image element in the UI, if one is present; otherwise, it's undefined.
   */
  imageEl?: HTMLImageElement | HTMLVideoElement;

  /**
   * Preloader element for the image.
   */
  imagePreloader: HTMLElement;

  /**
   * Caption element for the image.
   */
  caption: HTMLElement;
}

/**
 * ConstructorParams interface representing parameters for the Ui class constructor.
 */
interface ConstructorParams {
  /**
   * Editor.js API.
   */
  api: API;
  /**
   * Configuration for the image.
   */
  config: ImageConfig;
  /**
   * Callback function for selecting a file.
   */
  onSelectFile: () => void;
  /**
   * Flag indicating if the UI is in read-only mode.
   */
  readOnly: boolean;
}

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 */
export default class Ui {
  /**
   * Nodes representing various elements in the UI.
   */
  public nodes: Nodes;

  /**
   * API instance for Editor.js.
   */
  private api: API;

  private isResizing: boolean = false;

  /**
   * Configuration for the image tool.
   */
  private config: ImageConfig;

  /**
   * Callback function for selecting a file.
   */
  private onSelectFile: () => void;

  /**
   * Flag indicating if the UI is in read-only mode.
   */
  private readOnly: boolean;

  private contentRatio: number = 1;

  /**
   * @param ui - image tool Ui module
   * @param ui.api - Editor.js API
   * @param ui.config - user config
   * @param ui.onSelectFile - callback for clicks on Select file button
   * @param ui.readOnly - read-only mode flag
   */
  constructor({ api, config, onSelectFile, readOnly }: ConstructorParams) {
    this.api = api;
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.readOnly = readOnly;
    this.nodes = {
      wrapper: make('div', [this.CSS.baseClass, this.CSS.wrapper]),
      imageContainer: make('div', [this.CSS.imageContainer]),
      fileButton: this.createFileButton(),
      imageEl: undefined,
      imagePreloader: make('div', this.CSS.imagePreloader),
      caption: make('div', [this.CSS.caption], {
        contentEditable: !this.readOnly,
      }),
    };

    // Bind methods to the class instance
    this.resizeImage = this.resizeImage.bind(this);
    this.addFileButton = this.addFileButton.bind(this);
    this.removeFileButton = this.removeFileButton.bind(this);

    /**
     * Create base structure
     *  <wrapper>
     *    <image-container>
     *      <image-preloader />
     *    </image-container>
     *    <caption />
     *    <number-input />
     *    <select-file-button />
     *  </wrapper>
     */
    this.nodes.caption.dataset.placeholder = this.config.captionPlaceholder;

    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader);
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);

    this.nodes.wrapper.appendChild(this.nodes.fileButton);
  }

  /**
   * Renders tool UI
   * @param toolData - saved tool data
   */
  public render(toolData: ImageToolData): HTMLElement {
    if (
      toolData.file === undefined ||
      Object.keys(toolData.file).length === 0
    ) {
      this.toggleStatus(UiState.Empty);
    } else {
      this.toggleStatus(UiState.Uploading);
    }

    return this.nodes.wrapper;
  }

  /**
   * Shows uploading preloader
   * @param src - preview source
   */
  public showPreloader(src: string): void {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;
    this.toggleStatus(UiState.Uploading);
  }

  /**
   * Hide uploading preloader
   */
  public hidePreloader(): void {
    this.nodes.imagePreloader.style.backgroundImage = '';
    this.toggleStatus(UiState.Empty);
  }

  /**
   * Shows an image
   * @param url - image source
   */
  public fillImage(url: string, height?: string, width?: string): void {
    /**
     * Check for a source extension to compose element correctly: video tag for mp4, img — for others
     */
    const tag = /\.mp4$/.test(url) ? 'VIDEO' : 'IMG';

    const attributes: { [key: string]: string | boolean } = {
      src: url,
    };

    /**
     * We use eventName variable because IMG and VIDEO tags have different event to be called on source load
     * - IMG: load
     * - VIDEO: loadeddata
     */
    let eventName = 'load';

    /**
     * Update attributes and eventName if source is a mp4 video
     */
    if (tag === 'VIDEO') {
      /**
       * Add attributes for playing muted mp4 as a gif
       */
      attributes.autoplay = true;
      attributes.loop = true;
      attributes.muted = true;
      attributes.playsinline = true;
      attributes.controls = true;

      /**
       * Change event to be listened
       */
      eventName = 'loadeddata';
    }

    /**
     * Compose tag with defined attributes
     */
    this.nodes.imageEl = make(
      tag,
      [this.CSS.imageEl, 'resizable-image'],
      attributes
    ) as HTMLImageElement | HTMLVideoElement;

    /**
     * Add load event listener
     */
    this.nodes.imageEl.addEventListener(eventName, (e: Event) => {
      this.toggleStatus(UiState.Filled);
      if (height !== undefined && width !== undefined) {
        this.nodes.imageEl!.style.width = `${width}px`;

        this.nodes.imageEl!.style.height = `${height}px`;
        this.contentRatio = parseInt(height, 10) / parseInt(width, 10);
      } else {
        this.contentRatio =
          (this.nodes.imageEl?.clientHeight ?? 1) /
          (this.nodes.imageEl?.clientWidth ?? 1);
      }
      /**
       * Preloader does not exists on first rendering with presaved data
       */
      if (this.nodes.imagePreloader !== undefined) {
        this.nodes.imagePreloader.style.backgroundImage = '';
      }
    });

    const contentWrapper = make('div', ['content-wrapper']);

    const imageContainer = make('div', ['image-container']);

    imageContainer.appendChild(this.nodes.imageEl);
    contentWrapper.appendChild(imageContainer);
    this.nodes.imageContainer.appendChild(contentWrapper);
    if (!this.readOnly) {
      this.nodes.imageContainer.classList.add('resizable-container');

      imageContainer.appendChild(this.createResizer('left'));
      imageContainer.appendChild(this.createResizer('right'));
    }
    if (this.config.showCaption ?? true) {
      contentWrapper.appendChild(this.nodes.caption);
    }
  }

  /**
   *
   * @param e - mouse event
   * @param align - left or right
   */
  public resizeImage(e: MouseEvent, align: 'left' | 'right'): void {
    if (!this.isResizing || this.nodes.imageEl === undefined) {
      return;
    }
    const rect = this.nodes.imageEl.getBoundingClientRect();

    let offset = rect.left - e.clientX;

    if (align === 'right') {
      offset = e.clientX - rect.right;
    }

    let newWidth = rect.width + offset;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    newWidth = Math.max(newWidth, 30);
    const newHeight = newWidth * this.contentRatio;

    this.nodes.imageEl.style.width = `${newWidth}px`;

    this.nodes.imageEl.style.height = `${newHeight}px`;
  }

  /**
   * Shows caption input
   * @param text - caption content text
   */
  public fillCaption(text: string): void {
    if (this.nodes.caption !== undefined) {
      this.nodes.caption.innerHTML = text;
    }
  }

  /**
   * CSS classes
   */
  private get CSS(): Record<string, string> {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,

      /**
       * Tool's classes
       */
      wrapper: 'image-tool',
      imageContainer: 'image-tool__image',
      imagePreloader: 'image-tool__image-preloader',
      imageEl: 'image-tool__image-picture',
      caption: 'image-tool__caption',
    };
  }

  /**
   * Creates upload-file button
   */
  private createFileButton(): HTMLElement {
    const button = make('div', [this.CSS.button]);

    button.innerHTML =
      this.config.buttonContent ??
      `${IconPicture} ${this.api.i18n.t('Select an Image')}`;

    button.addEventListener('click', () => {
      this.onSelectFile();
    });

    return button;
  }

  /**
   * Changes UI status
   * @param status - see {@link Ui.status} constants
   */
  private toggleStatus(status: UiState): void {
    for (const statusType in UiState) {
      if (Object.prototype.hasOwnProperty.call(UiState, statusType)) {
        this.nodes.wrapper.classList.toggle(
          `${this.CSS.wrapper}--${UiState[statusType as keyof typeof UiState]}`,
          status === UiState[statusType as keyof typeof UiState]
        );
      }
    }
  }

  /**
   *
   * @param align - left or right
   * @returns HTMLElement
   */
  private createResizer(align: 'left' | 'right'): HTMLElement {
    const container = make('div', [`resize-container-${align}`]);

    const resizeHandle = make('div', ['resize-handle']);

    container.appendChild(resizeHandle);

    container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isResizing = true;

      const onMouseMove = (evt: MouseEvent): void => {
        this.resizeImage(evt, align);
      };

      document.addEventListener('mousemove', onMouseMove);

      const onMouseUp = (): void => {
        this.isResizing = false;

        document.removeEventListener('mousemove', onMouseMove);

        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mouseup', onMouseUp);
    });

    return container;
  }

  public removeFileButton(): void {
    this.nodes.wrapper.removeChild(this.nodes.fileButton);
  }

  public addFileButton(): void {
    this.nodes.wrapper.appendChild(this.nodes.fileButton);
  }
}
