import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

import BotContext from "./botContext";
import DB from "./mongo/database";

const width = 2000; //px
const height = 2000; //px
const backgroundColour = 'white'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour,
  plugins: {
    modern: ['chartjs-plugin-datalabels']
  }
});

interface IAnalytic {
  web: number;
  telegram: number;
  other: number;
}

export const handleAnalytics = async (chatId: number) => {
  const bot = BotContext.bot;
  const db = await DB.getInstance();
  const analytic = await db.collection('analytics').findOne<IAnalytic>({ name: 'pageView' });

  if (!analytic) {
    bot.sendMessage(chatId, 'Error bot didn\'t found analytic');

    return;
  }
  const { web, telegram, other } = analytic;

  const data = {
    labels: [
      'Web app',
      'Telegram bot',
      'Other',
    ],
    datasets: [{
      data: [web, telegram, other],
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(54, 188, 235, 0.7)',
      ],
    }]
  };

  const configuration = {
    type: 'polarArea',
    data,
    options: {
      layout: {
        padding: 20
      },
      responsive: true,
      scales: {
        r: {
          pointLabels: {
            display: true,
            centerPointLabels: true,
            font: {
              size: 43
            }
          },
          grid: {
            color: 'black'
          },
          ticks: {
            font: {
              size: 32
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 100,
            font: {
              size: 64
            }
          }
        },
        title: {
          display: true,
          text: 'Requests to DB',
          font: {
            size: 64
          },
          padding: {
            bottom: 50
          }
        },
        datalabels: {
          color: 'rgba(0, 0, 0, 0.5)',
          labels: {
            title: {
              font: {
                size: 36,
                weight: 'bold'
              }
            },
          }
        }
      }
    }
  };

  //@ts-ignore
  const image = await chartJSNodeCanvas.renderToBuffer(configuration);

  bot.sendPhoto(chatId, image);
}