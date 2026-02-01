using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechMaster.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingUserFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EmailNotifications",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Expertise",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LinkedInUrl",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotificationsEnabled",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Timezone",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TwitterUrl",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WebsiteUrl",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Internships",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FeeAmount",
                table: "Internships",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasFee",
                table: "Internships",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailNotifications",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Expertise",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LinkedInUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NotificationsEnabled",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Timezone",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TwitterUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "WebsiteUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Internships");

            migrationBuilder.DropColumn(
                name: "FeeAmount",
                table: "Internships");

            migrationBuilder.DropColumn(
                name: "HasFee",
                table: "Internships");
        }
    }
}
