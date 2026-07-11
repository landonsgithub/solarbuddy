import SolarBuddyWidget from './components/SolarBuddyWidget';


function App() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#eaeaea' }}>
      {/* Configured for Solar Buddy */}
      <SolarBuddyWidget industry="Solar Power" companyName="Solar Buddy" />
    </div>
  );
}

export default App;