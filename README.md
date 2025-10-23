![](https://badgen.net/badge/Editor.js/v2.0/blue)

# Image Tool (Enhanced Fork)

Enhanced Image Block for [Editor.js](https://editorjs.io) with interactive resizing, modern UI, and improved performance.

## 🎥 Demo

![Project Demo](https://github.com/blade47/image/raw/master/demo/demo.gif)

*Interactive resizing, modern UI, and smooth animations in action*

## 🚀 What's New in This Fork

This is an enhanced fork of the official [@editorjs/image](https://github.com/editor-js/image) tool with significant changes and a simplified, focused feature set.

### ✨ Major Enhancements

- **🎨 Interactive Image Resizing** - Drag handles on left/right sides to resize images dynamically
- **🎬 Enhanced Video Support** - Full support for MP4 videos with controls, autoplay, and loop
- **💎 Modern UI Design** - Complete visual overhaul with smooth animations, gradients, and improved aesthetics
- **⚡ Performance Optimizations** - Lazy loading, async image decoding, and improved rendering performance
- **🎯 Better Captions** - Centered captions that auto-hide when empty in read-only mode
- **🛡️ Improved Reliability** - Defensive dimension handling prevents data corruption
- **📐 Responsive Sizing** - Dimensions saved as percentages for automatic adaptation to container width changes
- **🎭 Fade-in Animations** - Smooth image loading transitions with opacity effects

### 🔄 Simplified Architecture

This fork **removes** the tunes/settings UI (border, background, stretch options) to provide a cleaner, more focused editing experience centered around the core functionality: uploading, displaying, and resizing images/videos.

## Features

### Core Features
- ✅ Upload files from device
- ✅ Paste copied content from the web
- ✅ Drag-and-drop image uploads
- ✅ Paste files and screenshots from Clipboard
- ✅ Caption support with auto-hide in read-only mode

### Enhanced Features (This Fork)
- ✨ **Interactive resize handles** - Drag left or right edges to resize images and videos
- ✨ **Video element support** - Display MP4 videos as embedded players
- ✨ **Modern preloader** - Animated spinner with loading text
- ✨ **Smooth transitions** - Fade-in effects with cubic-bezier easing
- ✨ **Responsive design** - Mobile-optimized with breakpoints at 768px and 800px
- ✨ **Responsive sizing** - Dimensions stored as percentages, adapting to container width
- ✨ **Dimension safety** - Never saves corrupted 0×0 dimensions
- ✨ **Aspect ratio preservation** - Automatic aspect ratio maintenance during resize
- ✨ **Backward compatibility** - Seamlessly handles old pixel-based data

**Notes**

This Tool requires server-side implementation for file uploading. See [backend response format](#server-format) for more details.

Video files are displayed using the `<video>` element with controls, autoplay, loop, and muted attributes for a GIF-like experience.

## Installation

Get the package

```shell
npm install @blade47/editorjs-image
# or
yarn add @blade47/editorjs-image
```

Include module at your application

```javascript
import ImageTool from '@blade47/editorjs-image';
```

## Usage

Add a new Tool to the `tools` property of the Editor.js initial config.

```javascript
import ImageTool from '@blade47/editorjs-image';

// or if you inject ImageTool via standalone script
const ImageTool = window.ImageTool;

var editor = EditorJS({
  ...

  tools: {
    ...
    image: {
      class: ImageTool,
      config: {
        endpoints: {
          byFile: 'http://localhost:8008/uploadFile', // Your backend file uploader endpoint
          byUrl: 'http://localhost:8008/fetchUrl', // Your endpoint that provides uploading by Url
        }
      }
    }
  }

  ...
});
```

## Config Params

Image Tool supports these configuration parameters:

| Field | Type     | Description        |
| ----- | -------- | ------------------ |
| endpoints | `{byFile: string, byUrl: string}` | **Required if no custom uploader.** Endpoints for file uploading. <br> Contains 2 fields: <br> __byFile__ - for file uploading <br> __byUrl__ - for uploading by URL |
| field | `string` | (default: `image`) Name of uploaded image field in POST request |
| types | `string` | (default: `image/*`) Mime-types of files that can be [accepted with file selection](https://github.com/codex-team/ajax#accept-string). Use `image/*,video/mp4` for video support. |
| additionalRequestData | `object` | Object with any data you want to send with uploading requests |
| additionalRequestHeaders | `object` | Object with any custom headers which will be added to request. [See example](https://github.com/codex-team/ajax/blob/e5bc2a2391a18574c88b7ecd6508c29974c3e27f/README.md#headers-object) |
| captionPlaceholder | `string` | (default: `Enter a caption`) Placeholder for caption input |
| buttonContent | `string` | Allows to override HTML content of «Select file» button |
| uploader | `{{uploadByFile: function, uploadByUrl: function}}` | Optional custom uploading methods. See details below. |
| actions | `array` | Array with custom actions to show in the tool's settings menu. See details below. |
| showCaption | `boolean` | (default: `true`) Show or hide the caption field |

Note that if you don't implement your custom uploader methods, the `endpoints` param is required.

## Custom Actions

You can add custom action buttons to the tool's settings menu:

```js
image: {
  class: ImageTool,
  config: {
    endpoints: {
      byFile: 'http://localhost:8008/uploadFile',
    },
    actions: [
      {
        name: 'download',
        icon: '<svg>...</svg>',
        title: 'Download Image',
        toggle: false,
        action: () => {
          // Your custom action logic
          console.log('Download clicked');
        }
      }
    ]
  }
}
```

## Output Data

This Tool returns `data` with following format

| Field   | Type     | Description                                           |
| ------- | -------- | ----------------------------------------------------- |
| file    | `object` | Uploaded file data. Any data got from backend uploader. Always contains the `url` property |
| caption | `string` | Image's caption                                       |
| width   | `string` | Image width as percentage of block holder (0-100) for responsive behavior. **Backward compatible:** Old pixel values (>100) are still supported. Height is always `auto` to maintain aspect ratio. |

```json
{
    "type": "image",
    "data": {
        "file": {
            "url": "https://www.tesla.com/tesla_theme/assets/img/_vehicle_redesign/roadster_and_semi/roadster/hero.jpg"
        },
        "caption": "Roadster // tesla.com",
        "width": "66.67"
    }
}
```

**Notes:**
- Unlike the original tool, this fork does not include `withBorder`, `withBackground`, or `stretched` fields as the tunes/settings UI has been removed for a cleaner, more focused experience.
- **Responsive sizing:** Width is stored as percentage relative to the Editor.js block holder, making images automatically adapt to different container widths while preserving the user's visual intent. Height is always `auto` to maintain aspect ratio.
- **Backward compatibility:** Old data with pixel values (e.g., `"800"`) or height fields is automatically detected and still works. New saves only store width in percentage format.

## Backend Response Format <a name="server-format"></a>

This Tool works by one of the following schemes:

1. Uploading files from the device
2. Uploading by URL (handle image-like URL's pasting)
3. Uploading by drag-n-drop file
4. Uploading by pasting from Clipboard

### Uploading Files from Device <a name="from-device"></a>

Scenario:

1. User selects file from the device
2. Tool sends it to **your** backend (on `config.endpoints.byFile` route)
3. Your backend should save file and return file data with JSON at specified format
4. Image tool shows saved image and stores server answer

So, you can implement backend for file saving by your own way. It is a specific and trivial task depending on your environment and stack.

The tool executes the request as [`multipart/form-data`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST), with the key as the value of `field` in configuration.

The response of your uploader **should** cover the following format:

```json5
{
    "success": 1,
    "file": {
        "url": "https://www.tesla.com/tesla_theme/assets/img/_vehicle_redesign/roadster_and_semi/roadster/hero.jpg",
        // ... and any additional fields you want to store, such as width, height, color, extension, etc
    }
}
```

**success** - uploading status. 1 for successful, 0 for failed

**file** - uploaded file data. **Must** contain a `url` field with full public path to the uploaded image.
Also, can contain any additional fields you want to store. For example, width, height, id etc.
All additional fields will be saved at the `file` object of output data.

### Uploading by Pasted URL

Scenario:

1. User pastes a URL of the image file to the Editor
2. Editor passes pasted string to the Image Tool
3. Tool sends it to **your** backend (on `config.endpoints.byUrl` route) via 'url' in request body
4. Your backend should accept URL, **download and save the original file by passed URL** and return file data with JSON at specified format
5. Image tool shows saved image and stores server answer

The tool executes the request as `application/json` with the following request body:

```json5
{
  "url": "<pasted URL from the user>",
  "additionalRequestData": "<additional request data from configuration>"
}
```

Response of your uploader should be at the same format as described at «[Uploading files from device](#from-device)» section.

### Uploading by Drag-n-Drop or from Clipboard

Your backend will accept file as FormData object in field name, specified by `config.field` (by default, «`image`»).
You should save it and return the same response format as described above.

## Providing Custom Uploading Methods

As mentioned at the Config Params section, you have an ability to provide own custom uploading methods.
It is quite simple: implement `uploadByFile` and `uploadByUrl` methods and pass them via `uploader` config param.
Both methods must return a Promise that resolves with response in a format that described at the [backend response format](#server-format) section.

| Method         | Arguments | Return value | Description |
| -------------- | --------- | -------------| ------------|
| uploadByFile   | `File`    | `{Promise.<{success, file: {url}}>}` | Upload file to the server and return uploaded image data |
| uploadByUrl    | `string`  | `{Promise.<{success, file: {url}}>}` | Send URL-string to the server, that should load image by this URL and return uploaded image data |

Example:

```js
import ImageTool from '@blade47/editorjs-image';

var editor = EditorJS({
  ...

  tools: {
    ...
    image: {
      class: ImageTool,
      config: {
        /**
         * Custom uploader
         */
        uploader: {
          /**
           * Upload file to the server and return uploaded image data
           * @param {File} file - file selected from the device or pasted by drag-n-drop
           * @return {Promise.<{success, file: {url}}>}
           */
          uploadByFile(file) {
            // your own uploading logic here
            return MyAjax.upload(file).then(() => {
              return {
                success: 1,
                file: {
                  url: 'https://codex.so/upload/redactor_images/o_80beea670e49f04931ce9e3b2122ac70.jpg',
                  // any other image data you want to store, such as width, height, color, extension, etc
                }
              };
            });
          },

          /**
           * Send URL-string to the server. Backend should load image by this URL and return uploaded image data
           * @param {string} url - pasted image URL
           * @return {Promise.<{success, file: {url}}>}
           */
          uploadByUrl(url) {
            // your ajax request for uploading
            return MyAjax.upload(url).then(() => {
              return {
                success: 1,
                file: {
                  url: 'https://codex.so/upload/redactor_images/o_e48549d1855c7fc1807308dd14990126.jpg',
                  // any other image data you want to store, such as width, height, color, extension, etc
                }
              }
            })
          }
        }
      }
    }
  }

  ...
});
```

## 🎨 Enhanced Features Guide

### Interactive Image Resizing

Images and videos can be resized by dragging the handles that appear on hover:

- **Left handle** - Resize from the left edge
- **Right handle** - Resize from the right edge
- **Aspect ratio** - Automatically maintained during resize
- **Minimum size** - Images cannot be resized below 30px width
- **Mobile** - Resize handles hidden on screens < 800px for better mobile experience

The resized dimensions are automatically saved and restored when the content is loaded again.

### Video Support

To enable video uploads, configure the `types` parameter:

```js
image: {
  class: ImageTool,
  config: {
    types: 'image/*,video/mp4',
    endpoints: {
      byFile: 'http://localhost:8008/uploadFile',
    }
  }
}
```

Videos are displayed with:
- ✅ Autoplay (muted for autoplay compliance)
- ✅ Loop playback (GIF-like behavior)
- ✅ Playback controls
- ✅ Inline playback (mobile-friendly)
- ✅ Same resize capabilities as images

### Modern UI Enhancements

This fork includes a completely redesigned interface with:

- **Gradient accents** - Modern blue gradients (#0066ff to #0052cc) on interactive elements
- **Smooth animations** - Fade-in effects and cubic-bezier easing for professional feel
- **Enhanced preloader** - Animated spinner with background gradient and loading text
- **Better spacing** - Improved padding and margins throughout
- **Rounded corners** - Modern 12px border radius (8px on mobile)
- **Shadow effects** - Subtle shadows on hover for depth perception
- **Centered captions** - Professional center-aligned captions
- **Responsive typography** - Optimized font sizes for mobile (14px → 13px)

### CSS Customization

The tool uses CSS custom properties for easy theming:

```css
.image-tool {
  --bg-color: #f7f9fc;
  --front-color: #0066ff;
  --border-color: #e1e8f0;
  --text-primary: #1a1a1a;
  --text-secondary: #6b7280;
}
```

## 🔧 Development

### Testing Locally

A development server is included for testing uploads:

```bash
node dev/server.js
```

This exposes port 8008 with two endpoints:
- `http://localhost:8008/uploadFile` - File upload endpoint
- `http://localhost:8008/fetchUrl` - URL fetch endpoint

Files are saved to `dev/.tmp/` directory.

Configure your tool to use these endpoints during development:

```js
config: {
  endpoints: {
    byFile: 'http://localhost:8008/uploadFile',
    byUrl: 'http://localhost:8008/fetchUrl',
  }
}
```

### Build

```bash
npm run build
```

Outputs:
- `dist/image.umd.js` - UMD bundle for `<script>` tags and CommonJS
- `dist/image.mjs` - ES module for modern imports
- `dist/index.d.ts` - TypeScript type declarations

### Linting

```bash
npm run lint          # Check for errors
npm run lint:errors   # Show errors only (quiet)
npm run lint:fix      # Auto-fix issues
```

## 📦 Package Information

- **Package:** `@blade47/editorjs-image`
- **Version:** 3.0.4
- **Original:** [@editorjs/image](https://github.com/editor-js/image) v2.10.3
- **License:** MIT
- **Repository:** https://github.com/blade47/image

## 🤝 Contributing

This is a fork maintained separately from the original Editor.js Image tool.

**Original Tool:** [editor-js/image](https://github.com/editor-js/image)
**This Fork:** [blade47/editorjs-image](https://github.com/blade47/image)

## 📝 Changelog

### v3.0.6 (2025-10-23)
- 🛡️ **Fixed critical dimension corruption bug** - prevents saving 0×0 dimensions
- 📐 **Changed to percentage-based sizing** - dimensions now saved as % of block holder for responsive behavior (fully backward compatible with old pixel values)
- 🔧 Fixed ESLint configuration issues (removed deprecated rules, resolved version conflicts)
- 📝 Improved code quality and TypeScript type safety
- ✨ Changed async `onPaste` to sync for better Editor.js compatibility

### v3.0.3 (2025-06)
- ✨ Added interactive image/video resizing with drag handles
- 🎨 Complete UI/UX overhaul with modern design system
- ⚡ Performance improvements (lazy loading, async decoding)
- 🎬 Enhanced video support with controls and autoplay
- 📐 Dimension persistence and restoration
- 🎯 Improved caption handling (centered, auto-hide in read-only)
- 🗑️ Removed tunes/settings UI (border, background, stretch) for simpler interface

### Earlier versions
- Added height input field
- Small refactoring and code quality improvements
- Video controls support
- Caption styling improvements
- Development dependency updates

## 📄 License

MIT

## 🙏 Credits

- Original tool by [CodeX Team](https://github.com/codex-team)
- Enhanced fork maintained by [blade47](https://github.com/blade47)
