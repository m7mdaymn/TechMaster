using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechMaster.Application.DTOs.Chat;
using TechMaster.Infrastructure.Services;

namespace TechMaster.API.Controllers;

public class ChatController : BaseApiController
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    /// <summary>
    /// Get user's chat rooms
    /// </summary>
    [Authorize]
    [HttpGet("rooms")]
    public async Task<IActionResult> GetMyRooms()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _chatService.GetUserChatRoomsAsync(CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Get chat room by ID
    /// </summary>
    [Authorize]
    [HttpGet("rooms/{roomId:guid}")]
    public async Task<IActionResult> GetRoom(Guid roomId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _chatService.GetChatRoomAsync(roomId, CurrentUserId.Value);
        return HandleResult(result);
    }

    /// <summary>
    /// Join a chat room
    /// </summary>
    [Authorize]
    [HttpPost("rooms/{roomId:guid}/join")]
    public async Task<IActionResult> JoinRoom(Guid roomId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _chatService.JoinChatRoomAsync(CurrentUserId.Value, roomId);
        return HandleResult(result);
    }

    /// <summary>
    /// Leave a chat room
    /// </summary>
    [Authorize]
    [HttpPost("rooms/{roomId:guid}/leave")]
    public async Task<IActionResult> LeaveRoom(Guid roomId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _chatService.LeaveChatRoomAsync(CurrentUserId.Value, roomId);
        return HandleResult(result);
    }

    /// <summary>
    /// Get messages in a chat room
    /// </summary>
    [Authorize]
    [HttpGet("rooms/{roomId:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid roomId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _chatService.GetMessagesAsync(roomId, CurrentUserId.Value, pageNumber, pageSize);
        return HandleResult(result);
    }

    /// <summary>
    /// Send a message (REST alternative to SignalR)
    /// </summary>
    [Authorize]
    [HttpPost("rooms/{roomId:guid}/messages")]
    public async Task<IActionResult> SendMessage(Guid roomId, [FromBody] SendMessageDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var messageDto = new Application.DTOs.Chat.SendMessageDto
        {
            ChatRoomId = roomId,
            Content = dto.Content
        };
        var result = await _chatService.SendMessageAsync(CurrentUserId.Value, messageDto);
        return HandleResult(result);
    }

    /// <summary>
    /// Mark messages as read
    /// </summary>
    [Authorize]
    [HttpPost("rooms/{roomId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid roomId)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        var result = await _chatService.MarkAsReadAsync(CurrentUserId.Value, roomId);
        return HandleResult(result);
    }

    /// <summary>
    /// Create a course chat room (Instructor only)
    /// </summary>
    [Authorize(Policy = "InstructorOrAdmin")]
    [HttpPost("rooms/course/{courseId:guid}")]
    public IActionResult CreateCourseRoom(Guid courseId, [FromBody] CreateCourseChatDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized();
        }

        // Course chat rooms are created via JoinChatRoomAsync
        // This endpoint can be simplified or removed
        return Ok(new { Message = "Course chat rooms are created automatically when course is created" });
    }
}

public record SendMessageDto
{
    public string Content { get; init; } = string.Empty;
}

public record CreateCourseChatDto
{
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
}
