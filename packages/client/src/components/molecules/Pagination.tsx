import { HStack, Button, Text, IconButton, Select } from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <HStack spacing={4} justify="space-between" w="full" flexWrap="wrap">
      <Text fontSize="sm" color="cream.300">
        Showing {startItem} to {endItem} of {totalCount} transactions
      </Text>

      <HStack spacing={2}>
        <IconButton
          aria-label="Previous page"
          icon={<FaChevronLeft />}
          size="sm"
          variant="outline"
          colorScheme="teal"
          isDisabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        />

        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <Text key={`ellipsis-${index}`} color="cream.300" px={2}>
                ...
              </Text>
            );
          }

          const pageNum = page as number;
          return (
            <Button
              key={pageNum}
              size="sm"
              variant={currentPage === pageNum ? 'solid' : 'outline'}
              colorScheme="teal"
              onClick={() => onPageChange(pageNum)}
              minW="40px"
            >
              {pageNum}
            </Button>
          );
        })}

        <IconButton
          aria-label="Next page"
          icon={<FaChevronRight />}
          size="sm"
          variant="outline"
          colorScheme="teal"
          isDisabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />

        {onPageSizeChange && (
          <Select
            size="sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            w="100px"
            bg="navy.900"
            borderColor="navy.700"
            color="cream.100"
            _hover={{ borderColor: 'teal.500' }}
            sx={{
              option: {
                bg: 'navy.900',
                color: 'cream.100',
              }
            }}
          >
            <option value={10} style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}>10</option>
            <option value={30} style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}>30</option>
            <option value={50} style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}>50</option>
            <option value={100} style={{ backgroundColor: '#1a2332', color: '#f5f3e7' }}>100</option>
          </Select>
        )}
      </HStack>
    </HStack>
  );
}
