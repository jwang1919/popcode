import bindAll from 'lodash-es/bindAll';
import isNil from 'lodash-es/isNil';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import get from 'lodash-es/get';
import preventClickthrough from 'react-prevent-clickthrough';
import ImmutablePropTypes from 'react-immutable-proptypes';

import {EditorLocation} from '../records';
import {
  createAceEditor,
  createAceSessionWithoutWorker,
  inheritFontStylesFromParentElement,
} from '../util/ace';

export default class ConsoleInput extends Component {
  constructor() {
    super();
    bindAll(this, '_ref');
  }

  componentDidUpdate({isTextSizeLarge: prevIsTextSizeLarge}) {
    const {isTextSizeLarge, requestedFocusedLine} = this.props;

    if (isTextSizeLarge !== prevIsTextSizeLarge) {
      requestAnimationFrame(() => {
        inheritFontStylesFromParentElement(this._editor);
      });
    }

    this._focusRequestedLine(requestedFocusedLine);
  }

  _focusRequestedLine(requestedFocusedLine) {
    if (get(requestedFocusedLine, 'component') !== 'console') {
      return;
    }

    this._editor.navigateLineEnd();
    this._editor.focus();
    this.props.onRequestedLineFocused();
  }

  _ref(containerElement) {
    const {onInput} = this.props;

    if (containerElement) {
      const editor = this._editor = createAceEditor(containerElement);
      const session = createAceSessionWithoutWorker('javascript');
      editor.setSession(session);
      editor.renderer.setShowGutter(false);
      editor.moveCursorTo(0, 0);
      editor.setOptions({
        highlightActiveLine: false,
        maxLines: 1,
        minLines: 1,
      });
      editor.resize();
      editor.focus();

      editor.commands.addCommand({
        name: 'historyPrevious',
        bindKey: 'Up',
        exec: () => {
          const {history} = this.props;
          if (history.size === 0) {
            return;
          }
          const {expression} = history.toList().get(history.size - 1);
          editor.setValue(expression);
          editor.clearSelection();
        },
      });
      session.on('change', ({action, lines}) => {
        if (action === 'insert' && lines.length === 2) {
          onInput(editor.getValue().replace('\n', ''));
          editor.setValue('', 0);
        }
      });
    } else if (!isNil(this._editor)) {
      this._editor.destroy();
    }
  }

  render() {
    return (
      <div
        className="console__row console__input"
        onClick={preventClickthrough}
      >
        <div className="console__chevron console__chevron_blue">&#xf054;</div>
        <div className="console__editor" ref={this._ref} />
      </div>
    );
  }
}

ConsoleInput.propTypes = {
  history: ImmutablePropTypes.iterable.isRequired,
  isTextSizeLarge: PropTypes.bool,
  requestedFocusedLine: PropTypes.instanceOf(EditorLocation),
  onInput: PropTypes.func.isRequired,
  onRequestedLineFocused: PropTypes.func.isRequired,
};

ConsoleInput.defaultProps = {
  requestedFocusedLine: null,
  isTextSizeLarge: false,
};
