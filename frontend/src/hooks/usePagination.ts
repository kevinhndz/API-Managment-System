interface UsePaginationProps {
  currentPage: number
  totalPages: number
  paginationItemsToDisplay: number
}

export function usePagination({ currentPage, totalPages, paginationItemsToDisplay }: UsePaginationProps) {
  const showLeftEllipsis = currentPage - 1 > paginationItemsToDisplay / 2
  const showRightEllipsis = totalPages - currentPage + 1 > paginationItemsToDisplay / 2

  if (totalPages <= paginationItemsToDisplay) {
    return {
      pages: Array.from({ length: totalPages }, (_, index) => index + 1),
      showLeftEllipsis: false,
      showRightEllipsis: false,
    }
  }

  const halfDisplay = Math.floor(paginationItemsToDisplay / 2)
  const rangeStart = Math.max(1, currentPage - halfDisplay)
  const rangeEnd = Math.min(totalPages, currentPage + halfDisplay)
  let start = rangeStart
  let end = rangeEnd

  if (start === 1) end = paginationItemsToDisplay
  if (end === totalPages) start = totalPages - paginationItemsToDisplay + 1
  if (showLeftEllipsis) start += 1
  if (showRightEllipsis) end -= 1

  return {
    pages: Array.from({ length: end - start + 1 }, (_, index) => start + index),
    showLeftEllipsis,
    showRightEllipsis,
  }
}
