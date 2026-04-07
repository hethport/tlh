import { useTranslation } from 'react-i18next';
import { JSX, useState } from 'react';
import { PipelineOverviewFragment, usePipelineOverviewLazyQuery } from '../graphql';
import { WithQuery } from '../WithQuery';
import { PaginatedTable } from '../PaginatedTable';
import { Navigate } from 'react-router-dom';
import { homeUrl } from '../urls';
import { DocumentInPipelineTableRow } from './DocumentInPipelineTableRow';

interface IProps extends PipelineOverviewFragment {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: string;
  filterByStep: string;
  filterByCreator: string;
  queryPage: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sortBy: string, sortDirection: string) => void;
  onFilterChange: (filterByStep: string, filterByCreator: string) => void;
}

function Inner({
  page,
  pageSize,
  sortBy,
  sortDirection,
  filterByStep,
  filterByCreator,
  queryPage,
  onPageSizeChange,
  onSortChange,
  onFilterChange,
  allReviewers,
  allCreators,
  documentsInPipeline,
  documentsInPipelineCount
}: IProps): JSX.Element {

  const { t } = useTranslation('common');

  const columnNames = [
    t('manuscriptIdentifier'),
    t('author'),
    t('creationDate'),
    t('appointedTransliterationReviewer'),
    t('appointedXmlConverter'),
    t('appointedFirstXmlReviewer'),
    t('appointedSecondXmlReviewer'),
    t('deleteManuscript')
  ];

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Toggle direction if same field
      onSortChange(field, sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // New field, default to DESC
      onSortChange(field, 'DESC');
    }
  };

  const handleFilterStepChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(event.target.value, filterByCreator);
  };

  const handleFilterCreatorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(filterByStep, event.target.value);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(parseInt(event.target.value));
  };

  return (
    <div>
      {/* Filter and control section */}
      <div className="mb-4 p-4 bg-slate-100 rounded">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Page size selector */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('rowsPerPage')}:</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="w-full p-2 border border-slate-300 rounded"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          {/* Filter by step */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('filterByStep')}:</label>
            <select
              value={filterByStep}
              onChange={handleFilterStepChange}
              className="w-full p-2 border border-slate-300 rounded"
            >
              <option value="all">{t('allSteps')}</option>
              <option value="transliterationReview">{t('transliterationReview')}</option>
              <option value="xmlConversion">{t('xmlConversion')}</option>
              <option value="firstXmlReview">{t('firstXmlReview')}</option>
              <option value="secondXmlReview">{t('secondXmlReview')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="completed">{t('completed')}</option>
            </select>
          </div>

          {/* Filter by creator */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('filterByCreator')}:</label>
            <select
              value={filterByCreator}
              onChange={handleFilterCreatorChange}
              className="w-full p-2 border border-slate-300 rounded"
            >
              <option value="all">{t('allCreators')}</option>
              {allCreators.map((creator) => (
                <option key={creator} value={creator}>{creator}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort controls */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">{t('sortBy')}:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSortChange('creationDate')}
              className={`px-4 py-2 rounded ${
                sortBy === 'creationDate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-300'
              }`}
            >
              {t('creationDate')} {sortBy === 'creationDate' && (sortDirection === 'ASC' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('manuscriptIdentifier')}
              className={`px-4 py-2 rounded ${
                sortBy === 'manuscriptIdentifier'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-300'
              }`}
            >
              {t('manuscriptIdentifier')} {sortBy === 'manuscriptIdentifier' && (sortDirection === 'ASC' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('transliterationReviewDate')}
              className={`px-4 py-2 rounded ${
                sortBy === 'transliterationReviewDate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-300'
              }`}
            >
              {t('transliterationReviewDate')} {sortBy === 'transliterationReviewDate' && (sortDirection === 'ASC' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('xmlConversionDate')}
              className={`px-4 py-2 rounded ${
                sortBy === 'xmlConversionDate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-300'
              }`}
            >
              {t('xmlConversionDate')} {sortBy === 'xmlConversionDate' && (sortDirection === 'ASC' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('firstXmlReviewDate')}
              className={`px-4 py-2 rounded ${
                sortBy === 'firstXmlReviewDate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-300'
              }`}
            >
              {t('firstXmlReviewDate')} {sortBy === 'firstXmlReviewDate' && (sortDirection === 'ASC' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('secondXmlReviewDate')}
              className={`px-4 py-2 rounded ${
                sortBy === 'secondXmlReviewDate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-300'
              }`}
            >
              {t('secondXmlReviewDate')} {sortBy === 'secondXmlReviewDate' && (sortDirection === 'ASC' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      <PaginatedTable
        count={documentsInPipelineCount}
        data={documentsInPipeline}
        columnNames={columnNames}
        emptyMessage={t('noDocumentsInPipelineYet')}
        page={page}
        pageSize={pageSize}
        queryPage={queryPage}
        isFixed={true}
      >
        {(documentInPipeline) => (
          <DocumentInPipelineTableRow
            key={documentInPipeline.manuscriptIdentifier}
            {...documentInPipeline}
            allReviewers={allReviewers}
          />
        )}
      </PaginatedTable>
    </div>
  );
}

export function PipelineOverview(): JSX.Element {

  const { t } = useTranslation('common');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState('creationDate');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [filterByStep, setFilterByStep] = useState('all');
  const [filterByCreator, setFilterByCreator] = useState('all');

  const [executePipelineOverviewQuery, pipelineOverviewQuery] = usePipelineOverviewLazyQuery();

  const executeQuery = (
    newPage: number,
    newPageSize: number,
    newSortBy: string,
    newSortDirection: string,
    newFilterByStep: string,
    newFilterByCreator: string
  ) => {
    executePipelineOverviewQuery({
      variables: {
        page: newPage,
        pageSize: newPageSize,
        sortBy: newSortBy,
        sortDirection: newSortDirection,
        filterByStep: newFilterByStep === 'all' ? undefined : newFilterByStep,
        filterByCreator: newFilterByCreator === 'all' ? undefined : newFilterByCreator
      }
    }).catch((error) => console.error(error));
  };

  if (!pipelineOverviewQuery.called) {
    executeQuery(page, pageSize, sortBy, sortDirection, filterByStep, filterByCreator);
  }

  const queryPage = (newPage: number): void => {
    executeQuery(newPage, pageSize, sortBy, sortDirection, filterByStep, filterByCreator);
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number): void => {
    executeQuery(0, newPageSize, sortBy, sortDirection, filterByStep, filterByCreator);
    setPage(0);
    setPageSize(newPageSize);
  };

  const handleSortChange = (newSortBy: string, newSortDirection: string): void => {
    executeQuery(page, pageSize, newSortBy, newSortDirection, filterByStep, filterByCreator);
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
  };

  const handleFilterChange = (newFilterByStep: string, newFilterByCreator: string): void => {
    executeQuery(0, pageSize, sortBy, sortDirection, newFilterByStep, newFilterByCreator);
    setPage(0);
    setFilterByStep(newFilterByStep);
    setFilterByCreator(newFilterByCreator);
  };

  return (
    <div className="container mx-auto">
      <h2 className="font-bold text-xl text-center mb-4">{t('pipelineOverview')}</h2>

      <WithQuery query={pipelineOverviewQuery}>
        {({ executiveEditorQueries }) => executiveEditorQueries
          ? <Inner
            {...executiveEditorQueries}
            page={page}
            pageSize={pageSize}
            sortBy={sortBy}
            sortDirection={sortDirection}
            filterByStep={filterByStep}
            filterByCreator={filterByCreator}
            queryPage={queryPage}
            onPageSizeChange={handlePageSizeChange}
            onSortChange={handleSortChange}
            onFilterChange={handleFilterChange}
          />
          : <Navigate to={homeUrl} />}
      </WithQuery>
    </div>
  );
}
