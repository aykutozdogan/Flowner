import React from 'react';
import DataGrid, { 
  Column, 
  Paging, 
  Pager, 
  HeaderFilter, 
  FilterRow, 
  SearchPanel,
  Selection,
  Scrolling,
  DataGridTypes
} from 'devextreme-react/data-grid';

interface FlowerDataGridProps extends DataGridTypes.Properties {
  columns?: Array<{
    dataField: string;
    caption?: string;
    dataType?: 'string' | 'number' | 'date' | 'boolean';
    width?: number | string;
    alignment?: 'left' | 'center' | 'right';
    allowSorting?: boolean;
    allowFiltering?: boolean;
    cellRender?: (cellData: any) => React.ReactNode;
  }>;
  enablePaging?: boolean;
  enableFiltering?: boolean;
  enableSearch?: boolean;
  pageSize?: number;
  'data-testid'?: string;
}

export function FlowerDataGrid({ 
  columns = [],
  enablePaging = true,
  enableFiltering = true,
  enableSearch = true,
  pageSize = 20,
  'data-testid': testId,
  ...props 
}: FlowerDataGridProps) {

  return (
    <DataGrid
      {...props}
      elementAttr={{
        'data-testid': testId,
        class: 'flowner-data-grid'
      }}
      showBorders={true}
      showRowLines={true}
      showColumnLines={true}
      rowAlternationEnabled={true}
      columnAutoWidth={true}
      wordWrapEnabled={true}
    >
      {/* Columns */}
      {columns.map((column, index) => (
        <Column
          key={`${column.dataField}-${index}`}
          dataField={column.dataField}
          caption={column.caption || column.dataField}
          dataType={column.dataType}
          width={column.width}
          alignment={column.alignment}
          allowSorting={column.allowSorting !== false}
          allowFiltering={column.allowFiltering !== false}
          cellRender={column.cellRender}
        />
      ))}

      {/* Paging */}
      {enablePaging && (
        <>
          <Paging
            defaultPageSize={pageSize}
            enabled={true}
          />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[10, 20, 50, 100]}
            showInfo={true}
            showNavigationButtons={true}
          />
        </>
      )}

      {/* Filtering */}
      {enableFiltering && (
        <>
          <HeaderFilter visible={true} />
          <FilterRow visible={true} />
        </>
      )}

      {/* Search */}
      {enableSearch && (
        <SearchPanel
          visible={true}
          highlightCaseSensitive={true}
          placeholder="Ara..."
        />
      )}

      {/* Selection */}
      <Selection mode="single" />

      {/* Scrolling */}
      <Scrolling mode="standard" />
    </DataGrid>
  );
}

export default FlowerDataGrid;