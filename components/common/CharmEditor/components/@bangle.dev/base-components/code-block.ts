import type { DOMOutputSpec, EditorState, EditorView, Node, Schema } from '@bangle.dev/pm';
import { keymap, setBlockType, textblockTypeInputRule } from '@bangle.dev/pm';
import { moveNode } from '@bangle.dev/pm-commands';
import { createObject, filter, findParentNodeOfType, insertEmpty } from '@bangle.dev/utils';
import type Token from 'markdown-it/lib/token';
import type { MarkdownSerializerState } from 'prosemirror-markdown';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  queryIsCodeActiveBlock
};
export const defaultKeys = {
  toCodeBlock: 'Shift-Ctrl-\\',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  insertEmptyParaBelow: 'Mod-Enter',
  tab: 'Tab'
};

const name = 'codeBlock';
const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function specFactory(): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        language: { default: '' },
        track: { default: [] }
      },
      content: 'text*',
      marks: '',
      group: 'block',
      code: true,
      defining: true,
      draggable: false,
      parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
      toDOM: (): DOMOutputSpec => ['pre', ['code', 0]]
    },
    markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
        state.write(`\`\`\`${node.attrs.language || ''}\n`);
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.write('```');
        state.closeBlock(node);
      },
      parseMarkdown: {
        code_block: { block: name, noCloseToken: true },
        fence: {
          block: name,
          getAttrs: (tok: Token) => ({ language: tok.info || '' }),
          noCloseToken: true
        }
      }
    }
  };
}

function pluginsFactory({ markdownShortcut = true, keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    return [
      markdownShortcut && textblockTypeInputRule(/^```$/, type),
      keybindings &&
        keymap(
          createObject([
            [keybindings.toCodeBlock, setBlockType(type)],

            [keybindings.moveUp, moveNode(type, 'UP')],
            [keybindings.moveDown, moveNode(type, 'DOWN')],

            [
              keybindings.insertEmptyParaAbove,
              filter(queryIsCodeActiveBlock(), insertEmpty(schema.nodes.paragraph, 'above', false))
            ],
            [
              keybindings.insertEmptyParaBelow,
              filter(queryIsCodeActiveBlock(), insertEmpty(schema.nodes.paragraph, 'below', false))
            ],
            [
              keybindings.tab,
              filter(queryIsCodeActiveBlock(), (state: EditorState, dispatch, view?: EditorView) => {
                if (dispatch && view) {
                  dispatch(state.tr.insertText('\t'));
                  view?.focus();
                }
                return true;
              })
            ]
          ])
        )
    ];
  };
}

export function queryIsCodeActiveBlock() {
  return (state: EditorState) => {
    const type = getTypeFromSchema(state.schema);
    return Boolean(findParentNodeOfType(type)(state.selection));
  };
}
