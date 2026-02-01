using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Library;

namespace TechMaster.Infrastructure.Services;

public interface ILibraryService
{
    Task<Result<PaginatedList<LibraryItemDto>>> GetLibraryItemsAsync(int pageNumber, int pageSize, string? category = null, string? search = null);
    Task<Result<LibraryItemDto>> GetLibraryItemByIdAsync(Guid itemId);
    Task<Result<LibraryItemDto>> CreateLibraryItemAsync(CreateLibraryItemDto dto);
    Task<Result<LibraryItemDto>> UpdateLibraryItemAsync(Guid itemId, CreateLibraryItemDto dto);
    Task<Result> DeleteLibraryItemAsync(Guid itemId);
    Task<Result<List<string>>> GetCategoriesAsync();
    Task<Result> IncrementDownloadCountAsync(Guid itemId);
    Task<Result> IncrementViewCountAsync(Guid itemId);
    Task<Result<LibraryStatsDto>> GetLibraryStatsAsync();
}

public class LibraryStatsDto
{
    public int TotalItems { get; set; }
    public int PdfCount { get; set; }
    public int VideoCount { get; set; }
    public int LinkCount { get; set; }
    public int DocumentCount { get; set; }
}
