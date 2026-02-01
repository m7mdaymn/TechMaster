namespace TechMaster.Application.Common.Models;

public class Result<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string? MessageAr { get; set; }
    public List<string> Errors { get; set; } = new();

    public static Result<T> Success(T data, string? message = null, string? messageAr = null)
    {
        return new Result<T>
        {
            IsSuccess = true,
            Data = data,
            Message = message,
            MessageAr = messageAr
        };
    }

    public static Result<T> Failure(string error, string? errorAr = null)
    {
        return new Result<T>
        {
            IsSuccess = false,
            Message = error,
            MessageAr = errorAr,
            Errors = new List<string> { error }
        };
    }

    public static Result<T> Failure(List<string> errors)
    {
        return new Result<T>
        {
            IsSuccess = false,
            Errors = errors
        };
    }
}

public class Result
{
    public bool IsSuccess { get; set; }
    public string? Message { get; set; }
    public string? MessageAr { get; set; }
    public List<string> Errors { get; set; } = new();

    public static Result Success(string? message = null, string? messageAr = null)
    {
        return new Result
        {
            IsSuccess = true,
            Message = message,
            MessageAr = messageAr
        };
    }

    public static Result Failure(string error, string? errorAr = null)
    {
        return new Result
        {
            IsSuccess = false,
            Message = error,
            MessageAr = errorAr,
            Errors = new List<string> { error }
        };
    }
}

public class PaginatedList<T>
{
    public List<T> Items { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}
