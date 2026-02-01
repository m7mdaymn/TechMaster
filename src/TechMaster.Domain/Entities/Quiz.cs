using TechMaster.Domain.Common;
using TechMaster.Domain.Enums;

namespace TechMaster.Domain.Entities;

public class Quiz : LocalizedEntity
{
    public QuizType Type { get; set; } = QuizType.Session;
    public int TimeLimit { get; set; } = 0; // 0 means no limit
    public int PassingScore { get; set; } = 70;
    public int MaxAttempts { get; set; } = 3;
    public bool ShuffleQuestions { get; set; } = true;
    public bool ShuffleOptions { get; set; } = true;
    public bool ShowCorrectAnswers { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;

    public Guid? SessionId { get; set; }
    public virtual Session? Session { get; set; }

    public Guid? ModuleId { get; set; }
    public virtual Module? Module { get; set; }

    public Guid? CourseId { get; set; }
    public virtual Course? Course { get; set; }

    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
    public virtual ICollection<QuizAttempt> Attempts { get; set; } = new List<QuizAttempt>();
}

public class Question : LocalizedEntity
{
    public string QuestionTextEn { get; set; } = string.Empty;
    public string QuestionTextAr { get; set; } = string.Empty;
    public string? ExplanationEn { get; set; }
    public string? ExplanationAr { get; set; }
    public int Points { get; set; } = 1;
    public int SortOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public Guid QuizId { get; set; }
    public virtual Quiz Quiz { get; set; } = null!;

    public virtual ICollection<QuestionOption> Options { get; set; } = new List<QuestionOption>();
    public virtual ICollection<QuestionAnswer> Answers { get; set; } = new List<QuestionAnswer>();
}

public class QuestionOption : BaseEntity
{
    public string OptionTextEn { get; set; } = string.Empty;
    public string OptionTextAr { get; set; } = string.Empty;
    public bool IsCorrect { get; set; } = false;
    public int SortOrder { get; set; } = 0;

    public Guid QuestionId { get; set; }
    public virtual Question Question { get; set; } = null!;
}

public class QuizAttempt : BaseEntity
{
    public Guid UserId { get; set; }
    public virtual ApplicationUser User { get; set; } = null!;

    public Guid QuizId { get; set; }
    public virtual Quiz Quiz { get; set; } = null!;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int Score { get; set; } = 0;
    public int TotalPoints { get; set; } = 0;
    public int CorrectAnswers { get; set; } = 0;
    public int TotalQuestions { get; set; } = 0;
    public bool IsPassed { get; set; } = false;
    public int AttemptNumber { get; set; } = 1;
    public int TimeSpentSeconds { get; set; } = 0;

    public virtual ICollection<QuestionAnswer> Answers { get; set; } = new List<QuestionAnswer>();
}

public class QuestionAnswer : BaseEntity
{
    public Guid AttemptId { get; set; }
    public virtual QuizAttempt Attempt { get; set; } = null!;

    public Guid QuestionId { get; set; }
    public virtual Question Question { get; set; } = null!;

    public Guid? SelectedOptionId { get; set; }
    public virtual QuestionOption? SelectedOption { get; set; }

    public bool IsCorrect { get; set; } = false;
    public int PointsEarned { get; set; } = 0;
}
