import { HomeScreen } from './components/HomeScreen';
import { transactions } from './transactions';

export default function App() {
  return (
    // Phone-width container, centred on desktop
    <div className="min-h-screen bg-gray-300 flex items-start justify-center py-8">
      <div
        className="relative bg-[#F7F6F7] overflow-hidden shadow-2xl"
        style={{ width: 390, height: 844, borderRadius: 44 }}
      >
        <HomeScreen transactions={transactions} balance={10_000} />
      </div>
    </div>
  );
}
