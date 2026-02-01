using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TechMaster.Application.Common.Models;
using TechMaster.Application.DTOs.Chat;
using TechMaster.Domain.Entities;
using TechMaster.Infrastructure.Persistence;

namespace TechMaster.Infrastructure.Services;

public class ChatService : IChatService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ChatService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<ChatRoomDto>>> GetUserChatRoomsAsync(Guid userId)
    {
        var chatRooms = await _context.ChatRoomMembers
            .Include(m => m.ChatRoom)
                .ThenInclude(r => r.Course)
            .Include(m => m.ChatRoom)
                .ThenInclude(r => r.Messages.OrderByDescending(msg => msg.CreatedAt).Take(1))
                    .ThenInclude(msg => msg.Sender)
            .Include(m => m.ChatRoom)
                .ThenInclude(r => r.Members)
            .Where(m => m.UserId == userId && !m.IsMuted)
            .Select(m => m.ChatRoom)
            .ToListAsync();

        var dtos = new List<ChatRoomDto>();
        foreach (var room in chatRooms)
        {
            var member = await _context.ChatRoomMembers
                .FirstOrDefaultAsync(m => m.ChatRoomId == room.Id && m.UserId == userId);

            var lastReadAt = member?.LastReadAt ?? DateTime.MinValue;
            var unreadCount = await _context.ChatMessages
                .CountAsync(m => m.ChatRoomId == room.Id && 
                                 m.CreatedAt > lastReadAt &&
                                 m.SenderId != userId);

            var dto = _mapper.Map<ChatRoomDto>(room);
            dto.UnreadCount = unreadCount;
            if (room.Messages.Any())
            {
                dto.LastMessage = _mapper.Map<ChatMessageDto>(room.Messages.First());
                dto.LastMessage.IsSender = room.Messages.First().SenderId == userId;
            }
            dtos.Add(dto);
        }

        return Result<List<ChatRoomDto>>.Success(dtos);
    }

    public async Task<Result<ChatRoomDto>> GetChatRoomAsync(Guid chatRoomId, Guid userId)
    {
        var chatRoom = await _context.ChatRooms
            .Include(r => r.Course)
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r => r.Id == chatRoomId);

        if (chatRoom == null)
        {
            return Result<ChatRoomDto>.Failure("Chat room not found", "غرفة المحادثة غير موجودة");
        }

        return Result<ChatRoomDto>.Success(_mapper.Map<ChatRoomDto>(chatRoom));
    }

    public async Task<Result<PaginatedList<ChatMessageDto>>> GetMessagesAsync(Guid chatRoomId, Guid userId, int pageNumber, int pageSize)
    {
        var query = _context.ChatMessages
            .Include(m => m.Sender)
            .Where(m => m.ChatRoomId == chatRoomId)
            .OrderByDescending(m => m.CreatedAt);

        var totalCount = await query.CountAsync();
        var messages = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = messages.Select(m =>
        {
            var dto = _mapper.Map<ChatMessageDto>(m);
            dto.IsSender = m.SenderId == userId;
            return dto;
        }).ToList();

        return Result<PaginatedList<ChatMessageDto>>.Success(new PaginatedList<ChatMessageDto>
        {
            Items = dtos,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    public async Task<Result<ChatMessageDto>> SendMessageAsync(Guid userId, SendMessageDto dto)
    {
        var member = await _context.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == dto.ChatRoomId && m.UserId == userId);

        if (member == null)
        {
            return Result<ChatMessageDto>.Failure("Not a member of this chat room", "لست عضوًا في غرفة المحادثة هذه");
        }

        if (member.IsMuted)
        {
            return Result<ChatMessageDto>.Failure("You are muted in this chat room", "أنت في وضع الصمت في غرفة المحادثة هذه");
        }

        var message = new ChatMessage
        {
            ChatRoomId = dto.ChatRoomId,
            SenderId = userId,
            Content = dto.Content,
            IsAnnouncement = dto.IsAnnouncement
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        var savedMessage = await _context.ChatMessages
            .Include(m => m.Sender)
            .FirstAsync(m => m.Id == message.Id);

        var messageDto = _mapper.Map<ChatMessageDto>(savedMessage);
        messageDto.IsSender = true;

        return Result<ChatMessageDto>.Success(messageDto);
    }

    public async Task<Result<ChatMessageDto>> EditMessageAsync(Guid userId, EditMessageDto dto)
    {
        var message = await _context.ChatMessages
            .Include(m => m.Sender)
            .FirstOrDefaultAsync(m => m.Id == dto.MessageId);

        if (message == null)
        {
            return Result<ChatMessageDto>.Failure("Message not found", "الرسالة غير موجودة");
        }

        if (message.SenderId != userId)
        {
            return Result<ChatMessageDto>.Failure("Cannot edit another user's message", "لا يمكنك تعديل رسالة مستخدم آخر");
        }

        message.Content = dto.Content;
        message.IsEdited = true;
        message.EditedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var messageDto = _mapper.Map<ChatMessageDto>(message);
        messageDto.IsSender = true;

        return Result<ChatMessageDto>.Success(messageDto);
    }

    public async Task<Result> DeleteMessageAsync(Guid userId, Guid messageId)
    {
        var message = await _context.ChatMessages.FindAsync(messageId);
        if (message == null)
        {
            return Result.Failure("Message not found", "الرسالة غير موجودة");
        }

        if (message.SenderId != userId)
        {
            // Check if user is instructor or admin
            var user = await _context.Users.FindAsync(userId);
            if (user?.Role != Domain.Enums.UserRole.Admin && user?.Role != Domain.Enums.UserRole.Instructor)
            {
                return Result.Failure("Cannot delete another user's message", "لا يمكنك حذف رسالة مستخدم آخر");
            }
        }

        _context.ChatMessages.Remove(message);
        await _context.SaveChangesAsync();

        return Result.Success("Message deleted", "تم حذف الرسالة");
    }

    public async Task<Result> JoinChatRoomAsync(Guid userId, Guid chatRoomId)
    {
        var existing = await _context.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == chatRoomId && m.UserId == userId);

        if (existing != null)
        {
            return Result.Success("Already a member", "أنت عضو بالفعل");
        }

        var member = new ChatRoomMember
        {
            ChatRoomId = chatRoomId,
            UserId = userId,
            JoinedAt = DateTime.UtcNow
        };

        _context.ChatRoomMembers.Add(member);
        await _context.SaveChangesAsync();

        return Result.Success("Joined chat room", "تم الانضمام إلى غرفة المحادثة");
    }

    public async Task<Result> LeaveChatRoomAsync(Guid userId, Guid chatRoomId)
    {
        var member = await _context.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == chatRoomId && m.UserId == userId);

        if (member == null)
        {
            return Result.Failure("Not a member", "لست عضوًا");
        }

        _context.ChatRoomMembers.Remove(member);
        await _context.SaveChangesAsync();

        return Result.Success("Left chat room", "تم الخروج من غرفة المحادثة");
    }

    public async Task<Result> MarkAsReadAsync(Guid userId, Guid chatRoomId)
    {
        var member = await _context.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.ChatRoomId == chatRoomId && m.UserId == userId);

        if (member == null)
        {
            return Result.Failure("Not a member", "لست عضوًا");
        }

        member.LastReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Result.Success("Marked as read", "تم وضع علامة مقروء");
    }
}
