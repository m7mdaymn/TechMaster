using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Library;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class LibraryController : BaseApiController
{
    private readonly ILibraryService _libraryService;

    public LibraryController(ILibraryService libraryService)
    {
        _libraryService = libraryService;
    }

    /// <summary>
    /// Get all library items
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetItems(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? category = null,
        [FromQuery] string? search = null)
    {
        var result = await _libraryService.GetLibraryItemsAsync(pageNumber, pageSize, category, search);
        return HandleResult(result);
    }

    /// <summary>
    /// Get library item by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetItem(Guid id)
    {
        // Increment view count
        await _libraryService.IncrementViewCountAsync(id);

        var result = await _libraryService.GetLibraryItemByIdAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Get all categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var result = await _libraryService.GetCategoriesAsync();
        return HandleResult(result);
    }

    /// <summary>
    /// Get library statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await _libraryService.GetLibraryStatsAsync();
        return HandleResult(result);
    }

    /// <summary>
    /// Create a library item (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> CreateItem([FromBody] CreateLibraryItemDto dto)
    {
        var result = await _libraryService.CreateLibraryItemAsync(dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Update a library item (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] CreateLibraryItemDto dto)
    {
        var result = await _libraryService.UpdateLibraryItemAsync(id, dto);
        return HandleResult(result);
    }

    /// <summary>
    /// Delete a library item (Admin only)
    /// </summary>
    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id)
    {
        var result = await _libraryService.DeleteLibraryItemAsync(id);
        return HandleResult(result);
    }

    /// <summary>
    /// Track download
    /// </summary>
    [HttpPost("{id:guid}/download")]
    public async Task<IActionResult> TrackDownload(Guid id)
    {
        var result = await _libraryService.IncrementDownloadCountAsync(id);
        return HandleResult(result);
    }
}
