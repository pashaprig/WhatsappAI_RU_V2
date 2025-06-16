let dataObj = {}

const TABS = {
  CPYPTO: 'crypto',
  STOCK_EU: 'stockEu',
  STOCK_US: 'stockUS',
  CFD: 'cfd'
}

const assets = {
  crypto: [
    { name: "Bitcoin", ticker: "BTC-USD" },
    { name: "Ethereum", ticker: "ETH-USD" },
    { name: "Ripple", ticker: "XRP-USD" },
    { name: "Solana", ticker: "SOL-USD" },
    { name: "Cardano", ticker: "ADA-USD" },
  ],
  europeanStocks: [
    { name: "Volkswagen AG", ticker: "VOW.DE", },
    { name: "Airbus SE", ticker: "AIR.PA", },
    { name: "Siemens AG", ticker: "SIE.DE", },
    { name: "Nestlé S.A.", ticker: "NESN.SW", },
    { name: "Unilever PLC", ticker: "ULVR.L", },
  ],
  americanStocks: [
    { name: "Apple Inc.", ticker: "AAPL", },
    { name: "Amazon.com Inc.", ticker: "AMZN", },
    { name: "Tesla Inc.", ticker: "TSLA", },
    { name: "Microsoft Corp.", ticker: "MSFT", },
    { name: "NVIDIA Corporation", ticker: "NVDA", },
  ],
  cfdInstruments: [
    { name: "Gold Futures", ticker: "GC=F" },
    { name: "Brent Crude Oil", ticker: "BZ=F" },
    { name: "S&P 500 Index", ticker: "^GSPC" },
    { name: "EUR/USD", ticker: "EURUSD=X" },
    { name: "Silver Futures", ticker: "SI=F" },
  ]
};

class App {
  init() {
    this.initMobileMenu();
    this.initRange();
    this.initSlider();
    this.fetchCryptoPrices();
    this.initGetEUPrice();
    this.initGetUSAPrice();
    this.initGetCFDPrice();
    this.showHide();
    this.tabs();
  }

  constructor() {
    this.$currencyList = document.getElementById("currencyList");
    this.$stockEuList = document.getElementById("stockEuList");
    this.$stockUSAList = document.getElementById("stockUSAList");
    this.$stocCFDkList = document.getElementById("stocCFDkList");
    this.dataObj = {}
  }

  async getStockPrice(ticker, range = '5d', interval = '60m', retries = 3, delayMs = 30000) {
    const proxy = 'https://api.allorigins.win/raw?url=';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`;
    const target = encodeURIComponent(url);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(proxy + target);
        if (!res.ok) throw new Error(res.status);

        const data = await res.json();
        const result = data.chart.result?.[0];

        const meta = result?.meta;
        const timestamp = result?.timestamp;
        const closePrices = result?.indicators?.quote?.[0]?.close;

        if (!meta || !timestamp || !closePrices) throw new Error('Нет данных');

        const chartData = timestamp.map((ts, i) => [ts * 1000, closePrices[i]])
          .filter(point => point[1] !== null);

        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose ?? meta.chartPreviousClose;

        const usd_24h_change = prevClose
          ? +((price - prevClose) / prevClose * 100).toFixed(2)
          : null;

        // Поиск названия из assets
        let name = null;
        for (const category in assets) {
          const found = assets[category].find(item => item.ticker === ticker);
          if (found) {
            name = found.name;
            break;
          }
        }

        return {
          name: name || meta.longName || meta.shortName,
          ticker: meta.symbol,
          usd: price,
          usd_24h_change,
          history: chartData
        };

      } catch (err) {
        console.error(`Попытка ${attempt} — ошибка при получении данных для ${ticker}:`, err);

        if (attempt === retries) {
          return null;
        }
        // Ждем перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  initGetEUPrice() {
    return this.initGetPriceByRegion(
      TABS.STOCK_EU,
      assets.europeanStocks,
      this.$stockEuList
    );
  }

  initGetUSAPrice() {
    return this.initGetPriceByRegion(
      TABS.STOCK_US,
      assets.americanStocks,
      this.$stockUSAList
    );
  }

  initGetCFDPrice() {
    return this.initGetPriceByRegion(
      TABS.CFD,
      assets.cfdInstruments,
      this.$stocCFDkList
    );
  }

  initGetCripto2Price() {
    return this.initGetPriceByRegion(
      TABS.CPYPTO,
      assets.crypto,
      this.$currencyList
    );
  }

  async initGetPriceByRegion(tab, assetList, renderTarget) {
    const tickers = assetList.map(stock => stock.ticker);
    const resultsObj = {};

    for (const ticker of tickers) {
      const info = await this.getStockPrice(ticker);

      if (info) resultsObj[info.name] = info;
    }

    if (!dataObj[tab]) dataObj[tab] = {};
    dataObj[tab].prices = resultsObj;

    const renderList = this.prepareCardData(tab);
    this.renderCards(renderList, renderTarget);
  }

  initMobileMenu() {
    const navMain = document.querySelector('.main-nav');
    const navToggle = document.querySelector('.main-nav__toggle');
    const navButtonText = document.querySelector('.main-nav__open-btn-text');

    const initJS = () => {
      navMain.classList.remove('main-nav--nojs');
    }

    const closeOpen = () => {
      navToggle.addEventListener('click', function () {
        if (navMain.classList.contains('main-nav--closed')) {
          navMain.classList.remove('main-nav--closed');
          navMain.classList.add('main-nav--opened');
          navButtonText.classList.add('visually-hidden');
        } else {
          navMain.classList.add('main-nav--closed');
          navMain.classList.remove('main-nav--opened');
        }
      });
    }

    const linksClick = () => {
      const mainNav = document.querySelector('.main-nav');
      const links = mainNav.querySelectorAll('a');

      const navLinckHandleClick = () => {
        navMain.classList.add('main-nav--closed');
        navMain.classList.remove('main-nav--opened');
      }

      links.forEach(link => {
        link.addEventListener('click', navLinckHandleClick)
      })
    }

    initJS();
    closeOpen();
    linksClick();
  }

  initRange() {
    let amount = 1000
    let month = 2
    const language = document.documentElement.getAttribute('lang');

    const update = () => {
      return '$ ' + Math.round(amount * (month * 1.85))
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    function getMonthWord(number) {
      const language = document.documentElement.getAttribute('lang');
      const lastDigit = number % 10;
      const lastTwoDigits = number % 100;

      if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return language === 'ru' ? 'месяцев' : 'months';
      }

      switch (lastDigit) {
        case 1:
          return language === 'ru' ? 'месяц' : 'month';
        case 2:
        case 3:
        case 4:
          return language === 'ru' ? 'месяца' : 'months';
        default:
          return language === 'ru' ? 'месяцев' : 'months';
      }
    }
    function get1MonthWord(lang) {
      return lang === 'ru' ? ' месяц' : ' month';
    }
    $(function () {
      $(".js-range-slider").ionRangeSlider({
        skin: "round",
        hide_min_max: false,
        hide_from_to: true,
        min: 250,
        max: 10000,
        from: amount,
        prefix: "$",
        grid: false,
        onStart: function (data) {
          $("#profitValue").text(update());
          $("#calcResult").text('$ ' + data.from.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "));
        },
        onChange: function (data) {
          amount = data.from
          $("#calcResult").text('$ ' + data.from.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "));
          $("#profitValue").text(update());
        }
      });
    });
    $(function () {
      $(".js-range-slider2").ionRangeSlider({
        skin: "round",
        hide_min_max: false,
        hide_from_to: true,
        min: 1,
        max: 12,
        from: month,
        postfix: get1MonthWord(language),
        grid: false,
        onStart: function () {
          $("#calcResult2").text(2 + ' ' + getMonthWord(2));
          $("#profitValue").text(update());
          setTimeout(function () {
            const slider = document.querySelector(".js-irs-1");
            if (slider) {
              const max = slider.querySelector(".irs-max");
              if (max) {
                max.textContent = language === 'ru' ? "12 месяцев" : "12 months";
              }
            }
          }, 100);
        },
        onChange: function (data) {
          const monthWord = getMonthWord(data.from);
          month = data.from
          $("#calcResult2").text(data.from.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' ' + monthWord);
          $("#profitValue").text(update());
        },
      });
    });
  }

  initSlider() {
    $(function () {
      $('.slider').slick({
        centerMode: true,
        centerPadding: '450px',
        slidesToShow: 1,
        responsive: [
          {
            breakpoint: 1024,
            settings: {
              slidesToShow: 1,
              centerMode: true,
              centerPadding: '30px',
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              centerMode: false,
              centerPadding: '0px',
            }
          }
        ]
      });
    });

    $('.slider-about').slick({
      dots: true,
      arrows: false,
      slidesToShow: 3,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 2,
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1,
          }
        }
      ]
    });
  }

  showHide() {
    document.querySelectorAll('.faq__container').forEach(container => {
      const button = container.querySelector('.faq__toggle-btn');
      const content = container.querySelector('.faq__dropdown-content');

      button.addEventListener('click', function () {
        container.classList.toggle('show');
        content.classList.toggle('show');
        button.classList.toggle('show');
      });
    });
  }

  async getCoinHistory(days = 5, currency, retries = 4, delayMs = 30000) {
    const url = `https://api.coingecko.com/api/v3/coins/${currency}/market_chart?vs_currency=usd&days=${days}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const data = await response.json();

        if (!dataObj.crypto) dataObj.crypto = {};
        dataObj.crypto.history = data;

        return data;

      } catch (error) {
        console.error(`Attempt ${attempt} - Error fetching ${currency} history:`, error);

        if (attempt === retries) {
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  prepareCardData(tab) {
    const data = dataObj?.[tab]?.prices || {};
    return Object.entries(data).map(([name, values]) => ({
      name,
      ...values
    }));
  }

  async fetchCryptoPrices(retries = 3, delayMs = 30000) {
    const url =
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,solana,cardano&vs_currencies=usd&include_24hr_change=true';

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Ошибка при запросе: ${response.status}`);

        const data = await response.json();

        if (!dataObj.crypto) dataObj.crypto = {};
        dataObj.crypto.prices = data;

        const renderList = this.prepareCardData(TABS.CPYPTO);

        const getHistory = true;
        this.renderCards(renderList, this.$currencyList, getHistory);

        break;
      } catch (error) {
        console.error(`Попытка ${attempt} — ошибка при получении курсов криптовалют:`, error.message);

        if (attempt === retries) {
          return null;
        }

        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  renderChart(elementId, data, percent) {

    const isNegative = percent < 0;
    const element = document.querySelector(`[data-chart-id="${elementId}"]`);

    element.innerHTML = "";

    if (!element) {
      console.error(`Элемент с ID ${elementId} не найден.`);
      return;
    }

    const options = {
      chart: {
        type: 'line',
        height: 53,
        width: 100,
        sparkline: {
          enabled: true
        }
      },
      series: [{
        name: '',
        data: data
      }],
      fill: {
        opacity: 0.3
      },
      colors: [isNegative ? '#B80000' : '#7FB800'],
      tooltip: {
        enabled: false
      },
      grid: {
        show: false
      }
    };

    const chart = new ApexCharts(element, options);
    chart.render();
  }

  async renderCards(list = [], container, getHistory) {
    const template = document.getElementById("currencyCardTemplate");
    container.innerHTML = '';

    list.forEach(async (item) => {
      const cardEl = this.createCardElement(template, item);
      container.appendChild(cardEl);

      if (getHistory) {
        const history = await this.getCoinHistory(7, item.name);

        if (history) {
          const pricesHistory = history.prices.map(item => item[1]);
          this.renderChart(`chart-${item.name.toLowerCase()}`, pricesHistory, item.usd_24h_change);
        }

      }
      else {
        const pricesHistory = item.history.map(item => item[1]);
        this.renderChart(`chart-${item.name.toLowerCase()}`, pricesHistory, item.usd_24h_change);
      }
    });
  }

  findTickerByName(name) {
    return assets.crypto.find(
      (coin) => coin.name.toLowerCase() === name.toLowerCase()
    )?.ticker || null;
  }

  createCardElement(template, coin) {

    const clone = template.content.cloneNode(true);
    const { name, usd, usd_24h_change } = coin;
    const ticker = this.findTickerByName(name);

    const li = clone.querySelector("li");
    const percentChange = usd_24h_change.toFixed(2);
    const isNegative = usd_24h_change < 0;

    clone.querySelector(".currency__name").textContent = name;
    clone.querySelector(".currency__ticker").textContent = ticker;
    clone.querySelector(".currency__currency").textContent = usd.toFixed(2);
    clone.querySelector(".currency__graph").setAttribute('data-chart-id', `chart-${name.toLowerCase()}`);

    const percentEl = clone.querySelector(".currency__percent");
    percentEl.textContent = (isNegative ? "" : "+") + percentChange;

    if (isNegative) {
      li.classList.add("reverse");
    }
    return clone;
  }

  tabs() {
    document.querySelectorAll('.tab__btn').forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');

        document.querySelectorAll('.tab__btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab__content').forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(tabId).classList.add('active');
      });
    });

  }
}

const app = new App();
document.addEventListener('DOMContentLoaded', app.init());
