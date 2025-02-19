import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapDNDIntl } from '../../testUtils';

import TableGroupHeaderRowElement from './tableGroupHeaderRow';

const board = TestBlockFactory.createBoard();
const view = TestBlockFactory.createBoardView(board);

const view2 = TestBlockFactory.createBoardView(board);
view2.fields.sortOptions = [];

const boardTreeNoGroup = {
  option: {
    id: '',
    value: '',
    color: 'propColorTurquoise'
  },
  cards: [],
  cardPages: []
};

const boardTreeGroup = {
  option: {
    id: 'value1',
    value: 'value 1',
    color: 'propColorTurquoise'
  },
  cards: [],
  cardPages: []
};

test('should match snapshot, no groups', async () => {
  const component = wrapDNDIntl(
    <TableGroupHeaderRowElement
      board={board}
      activeView={view}
      group={boardTreeNoGroup}
      readOnly={false}
      hideGroup={jest.fn()}
      addCard={jest.fn()}
      propertyNameChanged={jest.fn()}
      onDrop={jest.fn()}
      groupByProperty={{
        id: '',
        name: 'Property 1',
        type: 'text',
        options: [{ id: 'property1', value: 'Property 1', color: '' }]
      }}
    />
  );
  const { container } = render(component);
  expect(container).toMatchSnapshot();
});

test('should match snapshot with Group', async () => {
  const component = wrapDNDIntl(
    <TableGroupHeaderRowElement
      board={board}
      activeView={view}
      group={boardTreeGroup}
      readOnly={false}
      hideGroup={jest.fn()}
      addCard={jest.fn()}
      propertyNameChanged={jest.fn()}
      onDrop={jest.fn()}
    />
  );
  const { container } = render(component);
  expect(container).toMatchSnapshot();
});

test('should match snapshot on read only', async () => {
  const component = wrapDNDIntl(
    <TableGroupHeaderRowElement
      board={board}
      activeView={view}
      group={boardTreeGroup}
      readOnly={true}
      hideGroup={jest.fn()}
      addCard={jest.fn()}
      propertyNameChanged={jest.fn()}
      onDrop={jest.fn()}
    />
  );
  const { container } = render(component);
  expect(container).toMatchSnapshot();
});

test('should match snapshot, hide group', async () => {
  const hideGroup = jest.fn();

  const collapsedOptionsView = TestBlockFactory.createBoardView(board);
  collapsedOptionsView.fields.collapsedOptionIds = [boardTreeGroup.option.id];

  const component = wrapDNDIntl(
    <TableGroupHeaderRowElement
      board={board}
      activeView={collapsedOptionsView}
      group={boardTreeGroup}
      readOnly={false}
      hideGroup={hideGroup}
      addCard={jest.fn()}
      propertyNameChanged={jest.fn()}
      onDrop={jest.fn()}
    />
  );

  const { container } = render(component);
  const triangle = container.querySelector('[data-testid="ArrowDropDownOutlinedIcon"]');
  expect(triangle).not.toBeNull();

  act(() => {
    fireEvent.click(triangle as Element);
  });
  expect(hideGroup).toBeCalled();
  expect(container).toMatchSnapshot();
});

test('should match snapshot, add new', async () => {
  const addNew = jest.fn();

  const component = wrapDNDIntl(
    <TableGroupHeaderRowElement
      board={board}
      activeView={view}
      group={boardTreeGroup}
      readOnly={false}
      hideGroup={jest.fn()}
      addCard={addNew}
      propertyNameChanged={jest.fn()}
      onDrop={jest.fn()}
    />
  );

  const { container } = render(component);

  const triangle = container.querySelector('[data-testid="AddIcon"]');
  expect(triangle).not.toBeNull();
  userEvent.click(triangle as Element);

  expect(addNew).toBeCalled();
  expect(container).toMatchSnapshot();
});

test('should match snapshot, edit title', async () => {
  const component = wrapDNDIntl(
    <TableGroupHeaderRowElement
      board={board}
      activeView={view}
      group={boardTreeGroup}
      readOnly={false}
      hideGroup={jest.fn()}
      addCard={jest.fn()}
      propertyNameChanged={jest.fn()}
      onDrop={jest.fn()}
    />
  );

  const { container, getByTitle } = render(component);
  const input = getByTitle(/value 1/);
  act(() => {
    userEvent.click(input);
    userEvent.keyboard('{enter}');
  });

  expect(container).toMatchSnapshot();
});
