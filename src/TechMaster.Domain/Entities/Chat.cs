using TechMaster.Domain.Common;

namespace TechMaster.Domain.Entities;

public class ChatRoom : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public bool IsActive { get; set; } = true;

    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;

    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<ChatRoomMember> Members { get; set; } = new List<ChatRoomMember>();
}

public class ChatRoomMember : BaseEntity
{
    public Guid ChatRoomId { get; set; }
    public virtual ChatRoom ChatRoom { get; set; } = null!;

    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    public bool IsMuted { get; set; } = false;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastReadAt { get; set; }
}

public class ChatMessage : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public bool IsAnnouncement { get; set; } = false;
    public bool IsEdited { get; set; } = false;
    public DateTime? EditedAt { get; set; }

    public Guid ChatRoomId { get; set; }
    public virtual ChatRoom ChatRoom { get; set; } = null!;

    public Guid SenderId { get; set; }
    public virtual ApplicationUser Sender { get; set; } = null!;
}
