using System.Net;
using System.Text.Json;

namespace TechMaster.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse();

        switch (exception)
        {
            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.MessageEn = "Unauthorized access";
                response.MessageAr = "غير مصرح بالوصول";
                break;

            case KeyNotFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.MessageEn = "Resource not found";
                response.MessageAr = "المورد غير موجود";
                break;

            case ArgumentException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.MessageEn = exception.Message;
                response.MessageAr = "طلب غير صالح";
                break;

            case InvalidOperationException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.MessageEn = exception.Message;
                response.MessageAr = "عملية غير صالحة";
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.MessageEn = "An unexpected error occurred. Please try again later.";
                response.MessageAr = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.";
                break;
        }

        response.StatusCode = context.Response.StatusCode;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, options);

        await context.Response.WriteAsync(json);
    }
}

public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string MessageEn { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public string? Details { get; set; }
}
