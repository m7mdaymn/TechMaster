using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Auth;

namespace TechMaster.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public abstract class BaseApiController : ControllerBase
{
    protected Guid? CurrentUserId
    {
        get
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }
    }

    protected string? CurrentUserEmail => User.FindFirstValue(ClaimTypes.Email);

    protected string? CurrentUserRole => User.FindFirstValue(ClaimTypes.Role);

    protected bool IsAdmin => CurrentUserRole == "Admin";

    protected bool IsInstructor => CurrentUserRole == "Instructor" || CurrentUserRole == "Admin";

    protected IActionResult HandleResult<T>(TechMaster.Application.Common.Models.Result<T> result)
    {
        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }

    protected IActionResult HandleResult(TechMaster.Application.Common.Models.Result result)
    {
        if (result.IsSuccess)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }

    protected IActionResult HandleAuthResponse(AuthResponseDto response)
    {
        if (response.IsSuccess)
        {
            return Ok(response);
        }

        return BadRequest(response);
    }
}
