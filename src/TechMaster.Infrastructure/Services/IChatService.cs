using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Chat;

namespace TechMaster.Infrastructure.Services;

public interface IChatService
{
    Task<Result<List<ChatRoomDto>>> GetUserChatRoomsAsync(Guid userId);
    Task<Result<ChatRoomDto>> GetChatRoomAsync(Guid chatRoomId, Guid userId);
    Task<Result<PaginatedList<ChatMessageDto>>> GetMessagesAsync(Guid chatRoomId, Guid userId, int pageNumber, int pageSize);
    Task<Result<ChatMessageDto>> SendMessageAsync(Guid userId, SendMessageDto dto);
    Task<Result<ChatMessageDto>> EditMessageAsync(Guid userId, EditMessageDto dto);
    Task<Result> DeleteMessageAsync(Guid userId, Guid messageId);
    Task<Result> JoinChatRoomAsync(Guid userId, Guid chatRoomId);
    Task<Result> LeaveChatRoomAsync(Guid userId, Guid chatRoomId);
    Task<Result> MarkAsReadAsync(Guid userId, Guid chatRoomId);
}
