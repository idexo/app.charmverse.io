import type { DirectEditorProps } from '@bangle.dev/pm';
import { EditorView } from '@bangle.dev/pm';
import { isTestEnv, toHTMLString } from '@bangle.dev/utils';

import { BangleEditorState } from './bangle-editor-state';

type PMViewOpts = Omit<DirectEditorProps, 'state' | 'dispatchTransaction' | 'attributes'>;

export interface BangleEditorProps<PluginMetadata> {
  focusOnInit?: boolean;
  state: BangleEditorState<PluginMetadata>;
  pmViewOpts?: PMViewOpts;
}

export class BangleEditor<PluginMetadata = any> {
  destroyed: boolean;

  view: EditorView;

  constructor(element: HTMLElement, { focusOnInit = true, state, pmViewOpts = {} }: BangleEditorProps<PluginMetadata>) {
    this.destroyed = false;
    if (!(state instanceof BangleEditorState)) {
      throw new Error('state is required and must be an instance of BangleEditorState');
    }

    this.view = new EditorView(element, {
      state: state.pmState,
      dispatchTransaction: (transaction) => {
        const newState = this.view.state.apply(transaction);
        this.view.updateState(newState);
      },
      attributes: { class: 'bangle-editor', 'data-test': 'charm-editor-input' },
      ...pmViewOpts
    });

    if (focusOnInit) {
      this.focusView();
    }
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    if (this.view.isDestroyed) {
      this.destroyed = true;
      return;
    }

    this.destroyed = true;
    this.view.destroy();
  }

  focusView() {
    if (isTestEnv || this.view.hasFocus()) {
      return;
    }
    this.view.focus();
  }

  toHTMLString() {
    return toHTMLString(this.view.state);
  }
}
