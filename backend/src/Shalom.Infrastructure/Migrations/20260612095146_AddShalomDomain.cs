using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shalom.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShalomDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DailyCheckIns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    MoodRating = table.Column<int>(type: "int", nullable: false),
                    SpiritualRating = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyCheckIns", x => x.Id);
                    table.CheckConstraint("CK_DailyCheckIns_MoodRating", "[MoodRating] BETWEEN 1 AND 5");
                    table.CheckConstraint("CK_DailyCheckIns_SpiritualRating", "[SpiritualRating] BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "FK_DailyCheckIns_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FastingSchedules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EatingWindowStart = table.Column<TimeOnly>(type: "time", nullable: false),
                    EatingWindowEnd = table.Column<TimeOnly>(type: "time", nullable: false),
                    TargetFastHours = table.Column<int>(type: "int", nullable: false),
                    TimeZoneId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FastingSchedules", x => x.Id);
                    table.CheckConstraint("CK_FastingSchedules_TargetFastHours", "[TargetFastHours] > 0");
                    table.ForeignKey(
                        name: "FK_FastingSchedules_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FastingSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    TargetHours = table.Column<int>(type: "int", nullable: false),
                    EndedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FastingSessions", x => x.Id);
                    table.CheckConstraint("CK_FastingSessions_TargetHours", "[TargetHours] > 0");
                    table.ForeignKey(
                        name: "FK_FastingSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "People",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Relationship = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ContactCadenceDays = table.Column<int>(type: "int", nullable: true),
                    LastContactedOn = table.Column<DateOnly>(type: "date", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_People", x => x.Id);
                    table.ForeignKey(
                        name: "FK_People_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReadingPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReadingPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VersesOfDay",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayOfYear = table.Column<int>(type: "int", nullable: false),
                    Reference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Text = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    YouVersionUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VersesOfDay", x => x.Id);
                    table.CheckConstraint("CK_VersesOfDay_DayOfYear", "[DayOfYear] BETWEEN 1 AND 366");
                });

            migrationBuilder.CreateTable(
                name: "Workouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Equipment = table.Column<int>(type: "int", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    DistanceKm = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: true),
                    AvgHeartRateBpm = table.Column<int>(type: "int", nullable: true),
                    ActiveCalories = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Workouts", x => x.Id);
                    table.CheckConstraint("CK_Workouts_DurationMinutes", "[DurationMinutes] > 0");
                    table.ForeignKey(
                        name: "FK_Workouts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FastingScheduleOverrides",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    EatingWindowStart = table.Column<TimeOnly>(type: "time", nullable: false),
                    EatingWindowEnd = table.Column<TimeOnly>(type: "time", nullable: false),
                    FastingScheduleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FastingScheduleOverrides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FastingScheduleOverrides_FastingSchedules_FastingScheduleId",
                        column: x => x.FastingScheduleId,
                        principalTable: "FastingSchedules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GratitudeEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PersonId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Text = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    OccurredOn = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GratitudeEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GratitudeEntries_People_PersonId",
                        column: x => x.PersonId,
                        principalTable: "People",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GratitudeEntries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ImportantDates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PersonId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Month = table.Column<int>(type: "int", nullable: false),
                    Day = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: true),
                    LeadDays = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImportantDates", x => x.Id);
                    table.CheckConstraint("CK_ImportantDates_Day", "[Day] BETWEEN 1 AND 31");
                    table.CheckConstraint("CK_ImportantDates_LeadDays", "[LeadDays] >= 0");
                    table.CheckConstraint("CK_ImportantDates_Month", "[Month] BETWEEN 1 AND 12");
                    table.ForeignKey(
                        name: "FK_ImportantDates_People_PersonId",
                        column: x => x.PersonId,
                        principalTable: "People",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ImportantDates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ReadingPlanDays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReadingPlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayNumber = table.Column<int>(type: "int", nullable: false),
                    PassageReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    YouVersionUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    CompletedOn = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReadingPlanDays", x => x.Id);
                    table.CheckConstraint("CK_ReadingPlanDays_DayNumber", "[DayNumber] >= 1");
                    table.ForeignKey(
                        name: "FK_ReadingPlanDays_ReadingPlans_ReadingPlanId",
                        column: x => x.ReadingPlanId,
                        principalTable: "ReadingPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyCheckIns_UserId_Date",
                table: "DailyCheckIns",
                columns: new[] { "UserId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FastingScheduleOverrides_FastingScheduleId_DayOfWeek",
                table: "FastingScheduleOverrides",
                columns: new[] { "FastingScheduleId", "DayOfWeek" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FastingSchedules_UserId",
                table: "FastingSchedules",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FastingSessions_UserId_StartedAt",
                table: "FastingSessions",
                columns: new[] { "UserId", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_GratitudeEntries_PersonId",
                table: "GratitudeEntries",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_GratitudeEntries_UserId_OccurredOn",
                table: "GratitudeEntries",
                columns: new[] { "UserId", "OccurredOn" });

            migrationBuilder.CreateIndex(
                name: "IX_ImportantDates_PersonId",
                table: "ImportantDates",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_ImportantDates_UserId",
                table: "ImportantDates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_People_UserId_IsArchived",
                table: "People",
                columns: new[] { "UserId", "IsArchived" });

            migrationBuilder.CreateIndex(
                name: "IX_ReadingPlanDays_ReadingPlanId_DayNumber",
                table: "ReadingPlanDays",
                columns: new[] { "ReadingPlanId", "DayNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReadingPlans_Name",
                table: "ReadingPlans",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VersesOfDay_DayOfYear",
                table: "VersesOfDay",
                column: "DayOfYear",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Workouts_UserId_StartedAt",
                table: "Workouts",
                columns: new[] { "UserId", "StartedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DailyCheckIns");

            migrationBuilder.DropTable(
                name: "FastingScheduleOverrides");

            migrationBuilder.DropTable(
                name: "FastingSessions");

            migrationBuilder.DropTable(
                name: "GratitudeEntries");

            migrationBuilder.DropTable(
                name: "ImportantDates");

            migrationBuilder.DropTable(
                name: "ReadingPlanDays");

            migrationBuilder.DropTable(
                name: "VersesOfDay");

            migrationBuilder.DropTable(
                name: "Workouts");

            migrationBuilder.DropTable(
                name: "FastingSchedules");

            migrationBuilder.DropTable(
                name: "People");

            migrationBuilder.DropTable(
                name: "ReadingPlans");
        }
    }
}
