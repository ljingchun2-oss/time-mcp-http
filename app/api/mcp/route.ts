import { z } from "zod";
import { createMcpHandler } from "mcp-handler";

const DEFAULT_TIMEZONE = "Asia/Shanghai";

function formatCurrentTime(timezone: string) {
	const now = new Date();
	const formatter = new Intl.DateTimeFormat("zh-CN", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		weekday: "long",
	});
	const parts = formatter.formatToParts(now);
	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((p) => p.type === type)?.value ?? "";
	const local = `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} (${get("weekday")})`;

	const offsetFormatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		timeZoneName: "shortOffset",
	});
	const offset =
		offsetFormatter
			.formatToParts(now)
			.find((p) => p.type === "timeZoneName")?.value ?? "";

	return { local, offset, iso_utc: now.toISOString() };
}

const handler = createMcpHandler(
	(server) => {
		server.tool(
			"get_current_time",
			"Get the current real-world date and time. Use this whenever you need to know what time it actually is right now (e.g. to check if it's late at night or a mealtime).",
			{
				timezone: z
					.string()
					.optional()
					.describe(
						`IANA timezone name, e.g. "Asia/Shanghai" or "America/New_York". Defaults to ${DEFAULT_TIMEZONE} if omitted.`,
					),
			},
			async ({ timezone }) => {
				const tz = timezone || DEFAULT_TIMEZONE;
				try {
					const { local, offset, iso_utc } = formatCurrentTime(tz);
					return {
						content: [
							{
								type: "text",
								text: `当前时间（${tz}, UTC${offset.replace("GMT", "")}）：${local}\nUTC: ${iso_utc}`,
							},
						],
					};
				} catch {
					return {
						content: [
							{
								type: "text",
								text: `无法识别时区 "${tz}"，请使用标准 IANA 时区名称，例如 Asia/Shanghai。`,
							},
						],
						isError: true,
					};
				}
			},
		);
	},
	{},
	{ basePath: "/api" },
);

export { handler as GET, handler as POST, handler as DELETE };
