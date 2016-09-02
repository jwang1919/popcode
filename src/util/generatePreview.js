import i18n from 'i18next-client';
import castArray from 'lodash/castArray';
import pick from 'lodash/pick';
import base64 from 'base64-js';
import loopProtect from 'loop-protect';
import libraries from '../config/libraries';
import previewFrameLibraries from '../config/previewFrameLibraries';

const DOMParser = window.DOMParser;
const parser = new DOMParser();

const sourceDelimiter = '/*__POPCODESTART__*/';

const errorHandlerScript = `(${(() => {
  window.onerror = (fullMessage, _file, line, column, error) => {
    let name, message;
    if (error) {
      name = error.name;
      message = error.message;
    } else {
      const components = fullMessage.split(': ', 2);
      if (components.length === 2) {
        name = components[0];
        message = components[1];
      } else {
        name = 'Error';
        message = fullMessage;
      }
    }

    window.parent.postMessage(JSON.stringify({
      type: 'org.popcode.error',
      error: {
        name,
        message,
        line,
        column,
      },
    }), '*');
  };
}).toString()}());`;

const alertReplacementScript = `(${(() => {
  const _swal = window.swal;

  Object.defineProperty(window, // eslint-disable-line prefer-reflect
    'alert', {
      value: (message) => {
        _swal(message);
      },
    });
  delete window.swal; // eslint-disable-line prefer-reflect
}).toString()}());`;

class PreviewGenerator {
  constructor(project, options = {}) {
    this._project = project;
    this.previewDocument = parser.parseFromString(
      project.sources.html,
      'text/html'
    );
    this._previewHead = this._ensureElement('head');
    this.previewBody = this._ensureElement('body');

    this.previewText = (this.previewBody.innerText || '').trim();
    this._attachLibraries(options.nonBlockingAlerts);

    if (options.targetBaseTop) {
      this._addBase();
    }
    this._addCss();
    if (options.propagateErrorsToParent) {
      this._addErrorHandling();
    }

    if (options.nonBlockingAlerts) {
      this._addAlertHandling();
    }

    this._addJavascript(pick(options, 'breakLoops'));
  }

  _ensureDocumentElement() {
    let documentElement = this.previewDocument.documentElement;
    if (!documentElement) {
      documentElement = this.previewDocument.createElement('html');
      this.previewDocument.appendChild(documentElement);
    }
    return documentElement;
  }

  _ensureElement(elementName) {
    let element = this.previewDocument[elementName];
    if (!element) {
      element = this.previewDocument.createElement(elementName);
      this._ensureDocumentElement().appendChild(element);
    }
    return element;
  }

  _addBase() {
    const baseTag = this.previewDocument.createElement('base');
    baseTag.target = '_top';
    const firstChild = this._previewHead.childNodes[0];
    if (firstChild) {
      this._previewHead.insertBefore(baseTag, firstChild);
    } else {
      this._previewHead.appendChild(baseTag);
    }
  }

  _addCss() {
    const styleTag = this.previewDocument.createElement('style');
    styleTag.innerHTML = this._project.sources.css;
    this._previewHead.appendChild(styleTag);
  }

  _addJavascript({breakLoops = false}) {
    let source = this._project.sources.javascript;
    if (breakLoops) {
      try {
        source = loopProtect(source);
      } catch (e) {
        return '';
      }
    }
    const scriptTag = this.previewDocument.createElement('script');
    scriptTag.innerHTML =
      `\n${sourceDelimiter}\n${source}`;
    this.previewBody.appendChild(scriptTag);

    return this.previewDocument.documentElement.outerHTML;
  }

  _addErrorHandling() {
    const scriptTag = this.previewDocument.createElement('script');
    scriptTag.innerHTML = errorHandlerScript;
    this.previewBody.appendChild(scriptTag);
  }

  _addAlertHandling() {
    const scriptTag = this.previewDocument.createElement('script');
    scriptTag.innerHTML = alertReplacementScript;
    this.previewBody.appendChild(scriptTag);
  }

  _attachLibraries(includePreviewFrame = false) {
    this._project.enabledLibraries.forEach((libraryKey) => {
      const library = libraries[libraryKey];
      this._attachLibrary(library);
    });

    if (includePreviewFrame) {
      Object.keys(previewFrameLibraries).forEach((libraryKey) => {
        const library = previewFrameLibraries[libraryKey];
        this._attachLibrary(library);
      });
    }
  }

  _attachLibrary(library) {
    const css = library.css;
    const javascript = library.javascript;
    if (css !== undefined) {
      castArray(css).forEach(this._attachCssLibrary.bind(this));
    }
    if (javascript !== undefined) {
      castArray(javascript).
        forEach(this._attachJavascriptLibrary.bind(this));
    }
  }

  _attachCssLibrary(css) {
    const linkTag = this.previewDocument.createElement('link');
    linkTag.rel = 'stylesheet';

    const base64encoded = base64.fromByteArray(css);
    linkTag.href = `data:text/css;charset=utf-8;base64,${base64encoded}`;
    this._previewHead.appendChild(linkTag);
  }

  _attachJavascriptLibrary(javascript) {
    const scriptTag = this.previewDocument.createElement('script');
    const base64encoded = base64.fromByteArray(javascript);
    scriptTag.src =
      `data:text/javascript;charset=utf-8;base64,${base64encoded}`;
    this.previewBody.appendChild(scriptTag);
  }
}

function generatePreview(project, options) {
  return new PreviewGenerator(project, options).previewDocument;
}

function generateTextPreview(project) {
  return new PreviewGenerator(project).previewText;
}

export {sourceDelimiter, generateTextPreview};
export default generatePreview;
