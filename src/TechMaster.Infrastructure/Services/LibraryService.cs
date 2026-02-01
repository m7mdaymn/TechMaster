using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Library;
using TechMaster.Domain.Entities;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class LibraryService : ILibraryService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public LibraryService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<PaginatedList<LibraryItemDto>>> GetLibraryItemsAsync(int pageNumber, int pageSize, string? category = null, string? search = null)
    {
        var query = _context.LibraryItems
            .Include(i => i.Category)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(i => i.Category != null && i.Category.NameEn == category);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(i => i.NameEn.Contains(search) || i.NameAr.Contains(search) ||
                                     (i.DescriptionEn != null && i.DescriptionEn.Contains(search)) ||
                                     (i.DescriptionAr != null && i.DescriptionAr.Contains(search)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.IsPublic)
            .ThenByDescending(i => i.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Result<PaginatedList<LibraryItemDto>>.Success(new PaginatedList<LibraryItemDto>
        {
            Items = _mapper.Map<List<LibraryItemDto>>(items),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    public async Task<Result<LibraryItemDto>> GetLibraryItemByIdAsync(Guid itemId)
    {
        var item = await _context.LibraryItems.FindAsync(itemId);
        if (item == null)
        {
            return Result<LibraryItemDto>.Failure("Library item not found", "عنصر المكتبة غير موجود");
        }

        return Result<LibraryItemDto>.Success(_mapper.Map<LibraryItemDto>(item));
    }

    public async Task<Result<LibraryItemDto>> CreateLibraryItemAsync(CreateLibraryItemDto dto)
    {
        var item = _mapper.Map<LibraryItem>(dto);
        
        _context.LibraryItems.Add(item);
        await _context.SaveChangesAsync();

        return Result<LibraryItemDto>.Success(_mapper.Map<LibraryItemDto>(item), "Library item created successfully", "تم إنشاء عنصر المكتبة بنجاح");
    }

    public async Task<Result<LibraryItemDto>> UpdateLibraryItemAsync(Guid itemId, CreateLibraryItemDto dto)
    {
        var item = await _context.LibraryItems.FindAsync(itemId);
        if (item == null)
        {
            return Result<LibraryItemDto>.Failure("Library item not found", "عنصر المكتبة غير موجود");
        }

        _mapper.Map(dto, item);
        await _context.SaveChangesAsync();

        return Result<LibraryItemDto>.Success(_mapper.Map<LibraryItemDto>(item), "Library item updated successfully", "تم تحديث عنصر المكتبة بنجاح");
    }

    public async Task<Result> DeleteLibraryItemAsync(Guid itemId)
    {
        var item = await _context.LibraryItems.FindAsync(itemId);
        if (item == null)
        {
            return Result.Failure("Library item not found", "عنصر المكتبة غير موجود");
        }

        _context.LibraryItems.Remove(item);
        await _context.SaveChangesAsync();

        return Result.Success("Library item deleted successfully", "تم حذف عنصر المكتبة بنجاح");
    }

    public async Task<Result<List<string>>> GetCategoriesAsync()
    {
        var categories = await _context.LibraryItems
            .Where(i => i.Category != null)
            .Select(i => i.Category!.NameEn)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Result<List<string>>.Success(categories);
    }

    public async Task<Result> IncrementDownloadCountAsync(Guid itemId)
    {
        var item = await _context.LibraryItems.FindAsync(itemId);
        if (item == null)
        {
            return Result.Failure("Library item not found", "عنصر المكتبة غير موجود");
        }

        // Download tracking is handled via LibraryItemAccess entries with Downloaded = true
        // The item itself doesn't store a counter
        await _context.SaveChangesAsync();

        return Result.Success();
    }

    public async Task<Result> IncrementViewCountAsync(Guid itemId)
    {
        var item = await _context.LibraryItems.FindAsync(itemId);
        if (item == null)
        {
            return Result.Failure("Library item not found", "عنصر المكتبة غير موجود");
        }

        // View tracking is handled via LibraryItemAccess entries
        // The item itself doesn't store a counter
        await _context.SaveChangesAsync();

        return Result.Success();
    }

    public async Task<Result<LibraryStatsDto>> GetLibraryStatsAsync()
    {
        var allItems = await _context.LibraryItems.ToListAsync();
        var stats = new LibraryStatsDto
        {
            TotalItems = allItems.Count,
            PdfCount = allItems.Count(i => i.Type == Domain.Enums.MaterialType.PDF),
            VideoCount = allItems.Count(i => i.Type == Domain.Enums.MaterialType.Video),
            LinkCount = allItems.Count(i => i.Type == Domain.Enums.MaterialType.Link),
            DocumentCount = allItems.Count(i => i.Type == Domain.Enums.MaterialType.Document)
        };
        return Result<LibraryStatsDto>.Success(stats);
    }
}
