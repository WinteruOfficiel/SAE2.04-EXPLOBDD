export default function StartEndDatePicker({ date, setDate, min_max_date}: { date: { min: string, max: string }, setDate: (date: { min: string, max: string }) => void, min_max_date: { min: string, max: string } }) {

    return <>
        <div className="datePicker">
            <label htmlFor="debutdate">Date de début</label>
            <input type="date" id="debutdate" name="debutdate" min={min_max_date.min} max={date.max} value={date.min} onChange={(e) => setDate({ min: e.target.value, max: date.max })} />
        </div>
        <div className="datePicker">
            <label htmlFor="findate">Date de fin</label>
            <input type="date" id="findate" name="findate" min={date.min} max={min_max_date.max} value={date.max} onChange={(e) => setDate({ min: date.min, max: e.target.value })} />
        </div>
    </>
}