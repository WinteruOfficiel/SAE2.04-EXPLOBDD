import { Puff, Oval } from '@agney/react-loading';

export function MapLoading() {
    return (<div style={{ height: 800, width: '70%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Puff width="200" />
    </div>)
}

export function ChartLoading() {
    return (<div style={{ height: 650, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Oval width="200" />
    </div>)
}