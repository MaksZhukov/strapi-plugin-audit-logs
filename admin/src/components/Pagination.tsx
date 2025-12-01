import {
  Pagination as StrapiPagination,
  Button,
  Typography,
  Flex,
  Box,
} from '@strapi/design-system';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, pageCount, onPageChange }: PaginationProps) => {
  const getPaginationPages = () => {
    const pages: (number | string)[] = [];

    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (page <= 4) {
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(pageCount);
      } else if (page >= pageCount - 3) {
        pages.push('...');
        for (let i = pageCount - 4; i <= pageCount; i++) {
          pages.push(i);
        }
      } else {
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(pageCount);
      }
    }

    return pages;
  };

  const handleChangePagination = (pageNumber: number) => () => {
    onPageChange(pageNumber);
  };

  if (pageCount <= 0) {
    return null;
  }

  return (
    <Box paddingTop={4}>
      <Flex justifyContent="center">
        <StrapiPagination activePage={page} pageCount={pageCount}>
          {getPaginationPages().map((pageItem, index) => {
            if (pageItem === '...') {
              return (
                <Typography key={`ellipsis-${index}`} textColor="neutral600" variant="omega">
                  ...
                </Typography>
              );
            }
            return (
              <Button
                key={pageItem}
                onClick={handleChangePagination(pageItem as number)}
                variant="tertiary"
              >
                {pageItem}
              </Button>
            );
          })}
        </StrapiPagination>
      </Flex>
    </Box>
  );
};

export { Pagination };
