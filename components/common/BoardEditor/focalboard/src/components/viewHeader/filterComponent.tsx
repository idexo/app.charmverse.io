import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Divider, MenuItem, Select, Typography, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { capitalize } from 'lodash';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { v4 } from 'uuid';

import type { PageListItemsRecord } from 'components/common/BoardEditor/interfaces';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useViewFilter } from 'hooks/useViewFilter';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { Constants } from 'lib/focalboard/constants';
import type { FilterClause, FilterCondition } from 'lib/focalboard/filterClause';
import { createFilterClause } from 'lib/focalboard/filterClause';
import type { FilterGroup, FilterGroupOperation } from 'lib/focalboard/filterGroup';
import { createFilterGroup, isAFilterGroupInstance } from 'lib/focalboard/filterGroup';

import mutator from '../../mutator';

import FilterEntry from './filterEntry';

type Props = {
  properties: IPropertyTemplate[];
  activeView: BoardView;
  relationPropertiesCardsRecord: PageListItemsRecord;
};

const StyledFilterComponent = styled(Box)`
  min-width: 560px;
  max-width: 100%;
  padding: 10px;
`;

const FilterComponent = React.memo((props: Props) => {
  const { activeView, properties } = props;
  const localViewSettings = useLocalDbViewSettings();
  const currentFilter = useViewFilter(activeView);

  const changeViewFilter = (filterGroup: FilterGroup) => {
    // update filters locally if local settings context exist
    if (localViewSettings) {
      localViewSettings.setLocalFilters(filterGroup);
      return;
    }

    mutator.changeViewFilter(activeView.id, currentFilter, filterGroup);
  };

  const conditionClicked = (condition: FilterCondition, filter: FilterClause): void => {
    const filterGroup = createFilterGroup(currentFilter);
    const filterClause = filterGroup.filters.find(
      (_filter) => (_filter as FilterClause).filterId === filter.filterId
    ) as FilterClause;

    if (filterClause && filterClause.condition !== condition) {
      filterClause.condition = condition;

      changeViewFilter(filterGroup);
    }
  };

  const addFilterClicked = () => {
    const filterGroup = createFilterGroup(currentFilter);

    const filter = createFilterClause({
      condition: 'contains',
      propertyId: Constants.titleColumnId,
      values: [],
      filterId: v4()
    });

    filterGroup.filters.push(filter);
    changeViewFilter(filterGroup);
  };

  const deleteFilters = () => {
    changeViewFilter({ filters: [], operation: 'and' });
  };

  const filters: FilterClause[] =
    (currentFilter?.filters.filter((o) => !isAFilterGroupInstance(o)) as FilterClause[]) || [];

  function changeFilterGroupOperation(operation: FilterGroupOperation) {
    const filterGroup = createFilterGroup(currentFilter);
    filterGroup.operation = operation;
    changeViewFilter(filterGroup);
  }

  return (
    <StyledFilterComponent>
      {filters.length !== 0 && (
        <Stack gap={1} my={1}>
          {filters.map((filter, filterIndex) => (
            <Stack
              flexDirection='row'
              gap={1}
              key={`${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`}
              alignItems='center'
            >
              <Stack sx={{ width: 75 }} flexDirection='row' justifyContent='flex-end'>
                {filterIndex === 1 ? (
                  <Select<FilterGroupOperation>
                    size='small'
                    value={currentFilter.operation}
                    onChange={(e) => changeFilterGroupOperation(e.target.value as FilterGroupOperation)}
                    renderValue={(selected) => <Typography fontSize='small'>{capitalize(selected)}</Typography>}
                  >
                    {['Or', 'And'].map((option) => {
                      return (
                        <MenuItem key={option} value={option.toLowerCase()}>
                          <Typography>{option}</Typography>
                        </MenuItem>
                      );
                    })}
                  </Select>
                ) : (
                  <Typography fontSize='small'>
                    {filterIndex === 0 ? 'Where' : capitalize(currentFilter.operation)}
                  </Typography>
                )}
              </Stack>
              <FilterEntry
                changeViewFilter={changeViewFilter}
                properties={properties}
                conditionClicked={conditionClicked}
                filter={filter}
                currentFilter={currentFilter}
                relationPropertiesCardsRecord={props.relationPropertiesCardsRecord}
              />
            </Stack>
          ))}
        </Stack>
      )}

      <Button
        variant='outlined'
        color='secondary'
        size='small'
        onClick={addFilterClicked}
        sx={{ mt: filters.length !== 0 ? 1 : 0 }}
      >
        <FormattedMessage id='FilterComponent.add-filter' defaultMessage='+ Add filter' />
      </Button>
      {filters.length !== 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Button
            variant='outlined'
            color='error'
            startIcon={<DeleteOutlinedIcon fontSize='small' />}
            size='small'
            onClick={deleteFilters}
          >
            <FormattedMessage id='FilterComponent.delete-filter' defaultMessage='Delete filter' />
          </Button>
        </>
      )}
    </StyledFilterComponent>
  );
});

export default FilterComponent;
