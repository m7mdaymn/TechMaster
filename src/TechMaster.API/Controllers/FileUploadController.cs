using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TechMaster.API.Controllers;

[Authorize]
public class FileUploadController : BaseApiController
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<FileUploadController> _logger;

    public FileUploadController(IWebHostEnvironment env, ILogger<FileUploadController> logger)
    {
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Upload an image file (thumbnails, profile photos, etc.)
    /// </summary>
    [HttpPost("images")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        return await UploadFile(file, "images", new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" });
    }

    /// <summary>
    /// Upload a video file
    /// </summary>
    [HttpPost("videos")]
    [RequestSizeLimit(500 * 1024 * 1024)] // 500MB limit for videos
    public async Task<IActionResult> UploadVideo(IFormFile file)
    {
        return await UploadFile(file, "videos", new[] { ".mp4", ".webm", ".mov", ".avi", ".mkv" });
    }

    /// <summary>
    /// Upload a PDF or document file
    /// </summary>
    [HttpPost("documents")]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50MB limit
    public async Task<IActionResult> UploadDocument(IFormFile file)
    {
        return await UploadFile(file, "documents", new[] { ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt" });
    }

    /// <summary>
    /// Upload course materials
    /// </summary>
    [HttpPost("materials")]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100MB limit
    public async Task<IActionResult> UploadMaterial(IFormFile file)
    {
        return await UploadFile(file, "materials", new[] { ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip", ".rar", ".7z" });
    }

    /// <summary>
    /// Upload multiple files at once
    /// </summary>
    [HttpPost("multiple")]
    [RequestSizeLimit(200 * 1024 * 1024)] // 200MB total limit
    public async Task<IActionResult> UploadMultiple(List<IFormFile> files, [FromQuery] string type = "documents")
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new { IsSuccess = false, MessageEn = "No files provided" });
        }

        var uploadedUrls = new List<string>();
        var errors = new List<string>();

        foreach (var file in files)
        {
            try
            {
                string[] allowedExtensions = type switch
                {
                    "images" => new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" },
                    "videos" => new[] { ".mp4", ".webm", ".mov" },
                    _ => new[] { ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".zip" }
                };

                var result = await SaveFileAsync(file, type, allowedExtensions);
                if (result != null)
                {
                    uploadedUrls.Add(result);
                }
            }
            catch (Exception ex)
            {
                errors.Add($"{file.FileName}: {ex.Message}");
            }
        }

        return Ok(new
        {
            IsSuccess = true,
            Data = new
            {
                UploadedUrls = uploadedUrls,
                Errors = errors,
                TotalUploaded = uploadedUrls.Count,
                TotalFailed = errors.Count
            }
        });
    }

    private async Task<IActionResult> UploadFile(IFormFile file, string folder, string[] allowedExtensions)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { IsSuccess = false, MessageEn = "No file provided" });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new 
            { 
                IsSuccess = false, 
                MessageEn = $"Invalid file type. Allowed types: {string.Join(", ", allowedExtensions)}" 
            });
        }

        try
        {
            var url = await SaveFileAsync(file, folder, allowedExtensions);
            return Ok(new { IsSuccess = true, Data = new { Url = url, FileName = file.FileName, Size = file.Length } });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file: {FileName}", file.FileName);
            return StatusCode(500, new { IsSuccess = false, MessageEn = "Error uploading file" });
        }
    }

    private async Task<string> SaveFileAsync(IFormFile file, string folder, string[] allowedExtensions)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        
        if (!allowedExtensions.Contains(extension))
        {
            throw new ArgumentException($"Invalid file type: {extension}");
        }

        // Generate unique filename
        var fileName = $"{Guid.NewGuid()}{extension}";
        
        // Create directory structure: wwwroot/uploads/{folder}/{year}/{month}/
        var now = DateTime.UtcNow;
        var relativePath = Path.Combine("uploads", folder, now.Year.ToString(), now.Month.ToString("D2"));
        var uploadPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), relativePath);
        
        if (!Directory.Exists(uploadPath))
        {
            Directory.CreateDirectory(uploadPath);
        }

        var filePath = Path.Combine(uploadPath, fileName);
        
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return the relative URL
        return $"/{relativePath.Replace("\\", "/")}/{fileName}";
    }

    /// <summary>
    /// Delete a file
    /// </summary>
    [HttpDelete]
    public IActionResult DeleteFile([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
        {
            return BadRequest(new { IsSuccess = false, MessageEn = "No URL provided" });
        }

        try
        {
            // Security check - ensure the URL is within uploads folder
            if (!url.StartsWith("/uploads/"))
            {
                return BadRequest(new { IsSuccess = false, MessageEn = "Invalid file path" });
            }

            var relativePath = url.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString());
            var filePath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), relativePath);

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
                return Ok(new { IsSuccess = true, MessageEn = "File deleted successfully" });
            }
            
            return NotFound(new { IsSuccess = false, MessageEn = "File not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {Url}", url);
            return StatusCode(500, new { IsSuccess = false, MessageEn = "Error deleting file" });
        }
    }
}
