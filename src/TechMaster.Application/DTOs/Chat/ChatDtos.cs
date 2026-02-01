namespace TechMaster.Application.DTOs.Chat;

public class ChatRoomDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public int MemberCount { get; set; }
    public int UnreadCount { get; set; }
    public ChatMessageDto? LastMessage { get; set; }
}

public class ChatMessageDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsAnnouncement { get; set; }
    public bool IsEdited { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderProfileImage { get; set; }
    public bool IsSender { get; set; }
}

public class SendMessageDto
{
    public Guid ChatRoomId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsAnnouncement { get; set; }
}

public class EditMessageDto
{
    public Guid MessageId { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class CreateChatRoomDto
{
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string? Description { get; set; }
    public Guid? CourseId { get; set; }
    public List<Guid>? ParticipantIds { get; set; }
}
