import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

const TokenomicsPieChart = ({ launchpadData, lockedTokens }) => {
  ChartJS.register(ArcElement, Tooltip, Legend);
  const totalSupply = parseFloat(launchpadData.tokenInfo.total_supply);
  const totalTokenSale = parseFloat(launchpadData.total_token_sale);
  const unlockedTokens = totalSupply - totalTokenSale;

  const data1 = {
    labels: ["ICO", "Unlocked Tokens", "Locked Tokens"],
    datasets: [
      {
        data: [totalTokenSale, unlockedTokens, lockedTokens],
        backgroundColor: ["#F59E0B", "#3B82F6", "#32a852"],
        hoverBackgroundColor: ["#F59E0B", "#3B82F6", "#32a852"],
        borderColor: ["#F59E0B", "#3B82F6", "#32a852"],
        borderWidth: 1,
      },
    ],
  };

  const data2 = {
    labels: ["ICO", "Unlocked Tokens"],
    datasets: [
      {
        data: [totalTokenSale, unlockedTokens],
        backgroundColor: ["#F59E0B", "#3B82F6"],
        hoverBackgroundColor: ["#F59E0B", "#3B82F6"],
        borderColor: ["#F59E0B", "#3B82F6"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="w-full max-w-xs">
      <Pie data={lockedTokens !== 0 ? data1 : data2} />
    </div>
  );
};

export default TokenomicsPieChart;
