using TechMaster.Domain.Enums;

namespace TechMaster.Application.DTOs.Quiz;

public class QuizDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public QuizType Type { get; set; }
    public int TimeLimit { get; set; }
    public int PassingScore { get; set; }
    public int MaxAttempts { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleOptions { get; set; }
    public bool ShowCorrectAnswers { get; set; }
    public bool IsActive { get; set; }
    public int QuestionCount { get; set; }
    public int TotalPoints { get; set; }
    public Guid? SessionId { get; set; }
    public Guid? ModuleId { get; set; }
    public Guid? CourseId { get; set; }
}

public class QuizDetailDto : QuizDto
{
    public List<QuestionDto> Questions { get; set; } = new();
}

public class QuestionDto
{
    public Guid Id { get; set; }
    public string QuestionTextEn { get; set; } = string.Empty;
    public string QuestionTextAr { get; set; } = string.Empty;
    public string? ExplanationEn { get; set; }
    public string? ExplanationAr { get; set; }
    public int Points { get; set; }
    public int SortOrder { get; set; }
    public List<QuestionOptionDto> Options { get; set; } = new();
}

public class QuestionOptionDto
{
    public Guid Id { get; set; }
    public string OptionTextEn { get; set; } = string.Empty;
    public string OptionTextAr { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int SortOrder { get; set; }
}

public class CreateQuizDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public QuizType Type { get; set; }
    public int TimeLimit { get; set; }
    public int PassingScore { get; set; } = 70;
    public int MaxAttempts { get; set; } = 3;
    public bool ShuffleQuestions { get; set; } = true;
    public bool ShuffleOptions { get; set; } = true;
    public bool ShowCorrectAnswers { get; set; }
    public Guid? SessionId { get; set; }
    public Guid? ModuleId { get; set; }
    public Guid? CourseId { get; set; }
    public List<CreateQuestionDto>? Questions { get; set; }
}

public class CreateQuestionDto
{
    public string QuestionTextEn { get; set; } = string.Empty;
    public string QuestionTextAr { get; set; } = string.Empty;
    public string? ExplanationEn { get; set; }
    public string? ExplanationAr { get; set; }
    public int Points { get; set; } = 1;
    public int SortOrder { get; set; }
    public List<CreateQuestionOptionDto> Options { get; set; } = new();
}

public class CreateQuestionOptionDto
{
    public string OptionTextEn { get; set; } = string.Empty;
    public string OptionTextAr { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int SortOrder { get; set; }
}

public class QuizAttemptDto
{
    public Guid Id { get; set; }
    public Guid QuizId { get; set; }
    public string QuizName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public int CorrectAnswers { get; set; }
    public int TotalQuestions { get; set; }
    public bool IsPassed { get; set; }
    public int AttemptNumber { get; set; }
    public int TimeSpentSeconds { get; set; }
    public double ScorePercentage => TotalPoints > 0 ? (Score * 100.0 / TotalPoints) : 0;
}

public class StartQuizDto
{
    public Guid QuizId { get; set; }
}

public class SubmitQuizDto
{
    public Guid AttemptId { get; set; }
    public List<QuizAnswerDto> Answers { get; set; } = new();
}

public class QuizAnswerDto
{
    public Guid QuestionId { get; set; }
    public Guid? SelectedOptionId { get; set; }
}

public class QuizResultDto
{
    public Guid AttemptId { get; set; }
    public Guid? SessionId { get; set; }
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public int CorrectAnswers { get; set; }
    public int TotalQuestions { get; set; }
    public bool IsPassed { get; set; }
    public int TimeSpentSeconds { get; set; }
    public double ScorePercentage { get; set; }
    public List<QuestionResultDto>? QuestionResults { get; set; }
}

public class QuestionResultDto
{
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int PointsEarned { get; set; }
    public Guid? SelectedOptionId { get; set; }
    public Guid? CorrectOptionId { get; set; }
    public string? Explanation { get; set; }
}

public class UpdateQuizDto
{
    public string? NameEn { get; set; }
    public string? NameAr { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public QuizType? Type { get; set; }
    public int? TimeLimit { get; set; }
    public int? PassingScore { get; set; }
    public int? MaxAttempts { get; set; }
    public bool? ShuffleQuestions { get; set; }
    public bool? ShuffleOptions { get; set; }
    public bool? ShowCorrectAnswers { get; set; }
    public bool? IsActive { get; set; }
}

public class UpdateQuestionDto
{
    public string? QuestionTextEn { get; set; }
    public string? QuestionTextAr { get; set; }
    public string? ExplanationEn { get; set; }
    public string? ExplanationAr { get; set; }
    public int? Points { get; set; }
    public int? SortOrder { get; set; }
    public List<UpdateQuestionOptionDto>? Options { get; set; }
}

public class UpdateQuestionOptionDto
{
    public Guid? Id { get; set; }
    public string? OptionTextEn { get; set; }
    public string? OptionTextAr { get; set; }
    public bool? IsCorrect { get; set; }
    public int? SortOrder { get; set; }
}

public class SubmitAnswerDto
{
    public Guid QuestionId { get; set; }
    public Guid? SelectedOptionId { get; set; }
    public string? AnswerText { get; set; }
}
