import moment from "moment-business-days"
const FranceHolidays = [
	{ holidayDate: "2021-01-01", description: "New Year's Day" },
	{ holidayDate: "2021-04-02", description: "Good Friday" },
	{ holidayDate: "2021-04-05", description: "Easter Monday" },
	{ holidayDate: "2021-05-01", description: "Labour Day" },
	{ holidayDate: "2021-05-08", description: "V-E Day" },
	{ holidayDate: "2021-05-13", description: "Ascension Day" },
	{ holidayDate: "2021-05-24", description: "Whit Monday" },
	{ holidayDate: "2021-05-30", description: "Mother's Day" },
	{ holidayDate: "2021-06-20", description: "Father's Day" },
	{ holidayDate: "2021-07-14", description: "Bastille Day" },
	{ holidayDate: "2021-08-15", description: "Assumption Day" },
	{ holidayDate: "2021-11-01", description: "All Saints' Day" },
	{ holidayDate: "2021-11-11", description: "Armistice Day" },
	{ holidayDate: "2021-12-25", description: "Christmas Day" },
	{ holidayDate: "2021-12-26", description: "St. Stephen's Day" },
];

moment.updateLocale('fr', {
	holidays: FranceHolidays.map(i => i.holidayDate),
	holidayFormat: 'YYYY-MM-DD'
});
import dateformat from "dateformat"
export default class DATELib {
	static DateOnly(date: Date | string) {
		return dateformat(date, "yyyy-mm-dd")
	}
	static getNextBusinessDay(givenDate: Date, count = 1) {
		const date = (givenDate.toISOString().split('T'))[0]
		const delta = givenDate.getTime() - new Date(date).getTime()
		const prev = moment(date, 'YYYY-MM-DD').businessAdd(count).toDate()
		const out = new Date(prev.getTime() + delta)
		return out
	}
	static getPrevBusinessDay(givenDate: Date, count = 1) {
		const date = (givenDate.toISOString().split('T'))[0]
		const delta = givenDate.getTime() - new Date(date).getTime()
		const prev = moment(date, 'YYYY-MM-DD').businessSubtract(count).toDate()
		const out = new Date(prev.getTime() + delta)
		return out
	}
	static AddDays(date: Date, count = 1) {
		var out = new Date(date)
		out.setDate(out.getDate() + count)
		return out
	}
	static AddMonths(date: Date, count = 1) {
		var out = new Date(date)
		out.setMonth(out.getMonth() + count)
		return out
	}
	static GetTodayStart(date: Date) {
		var todayStart = new Date(date)
		todayStart.setHours(0, 0, 0, 0)
		return todayStart
	}
	static GetTodayEnd(date: Date) {
		var todayEnd = this.GetTodayStart(date)
		todayEnd.setDate(todayEnd.getDate() + 1)
		return todayEnd
	}
	static GetDayPrev(date: Date) {
		var dayPrev = this.GetTodayStart(date)
		dayPrev.setDate(dayPrev.getDate() - 1)
		return dayPrev
	}
	static GetMonthStart(date: Date) {
		const todayStart = this.GetTodayStart(date)
		const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth());
		return monthStart
	}
	static GetPrevMonth(date: Date) {
		const monthStart = this.GetMonthStart(date)
		var prevMonth = new Date(monthStart)
		prevMonth.setMonth(monthStart.getMonth() - 1)
		return prevMonth
	}
	static GetMonthEnd(date: Date) {
		const monthStart = this.GetMonthStart(date)
		var monthEnd = new Date(monthStart)
		monthEnd.setMonth(monthStart.getMonth() + 1)
		return monthEnd
	}
	static GetClosestMonth(date: Date) {
		const monthStart = this.GetMonthStart(date)
		const monthEnd = this.GetMonthEnd(date)
		const deltaStart = date.getTime() - monthStart.getTime()
		const deltaEnd = monthEnd.getTime() - date.getTime()
		return deltaStart < deltaEnd ? monthStart : monthEnd
	}
	static GetYearStart(date: Date, offset = 0) {
		const todayStart = this.GetTodayStart(date)
		var yearStart = new Date(todayStart.getFullYear(), 0, 1);
		yearStart.setDate(yearStart.getDate() + offset)
		return yearStart
	}
	static GetYearEnd(date: Date, offset = 0) {
		const yearStart = this.GetYearStart(date, offset)
		var yearEnd = new Date(yearStart)
		yearEnd.setFullYear(yearStart.getFullYear() + 1)
		return yearEnd
	}
	static GetYearMonthsStart(date: Date) {
		const yearStart = this.GetYearStart(date)
		var monthsStart = []
		for (var i = 0; i < 12; ++i) {
			monthsStart.push(new Date(yearStart.getFullYear(), i, 1));
		}
		return monthsStart
	}
	static GetWeekStart(date: Date) {
		const todayStart = this.GetTodayStart(date)
		var weekStart = todayStart
		weekStart.setDate(weekStart.getDate() - weekStart.getDay())
		return weekStart
	}
	static GetWeekEnd(date: Date) {
		var weekEnd = this.GetWeekStart(date)
		weekEnd.setDate(weekEnd.getDate() + 7)
		return weekEnd
	}
	static get todayStart() {
		const now = new Date()
		return this.GetTodayStart(now)
	}
	static get todayEnd() {
		const now = new Date()
		return this.GetTodayEnd(now)
	}
	static get monthStart() {
		const now = new Date()
		return this.GetMonthStart(now)
	}
	static get monthEnd() {
		const now = new Date()
		return this.GetMonthEnd(now)
	}
	static get weekStart() {
		const now = new Date()
		return this.GetWeekStart(now)
	}
	static get weekEnd() {
		const now = new Date()
		return this.GetWeekEnd(now)
	}
	static StringifyDates(dates: Date[]) {
		try {
			return JSON.stringify(dates)
		}
		catch (e) { return JSON.stringify([]) }
	}
	static ParseDates(json: string) {
		if (!json) return null
		try {
			var strings = JSON.parse(json)
			var dates = []
			for (const string of strings) {
				dates.push(new Date(string))
			}
			return dates
		}
		catch (e) { return null }
	}
	static DatesUnique(dates: Date[]) {
		const times = [...new Set(Array.from(dates, date => date.getTime()))]
		return Array.from(times, time => new Date(time))
	}
}
module.exports = DATELib;