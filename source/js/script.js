class App {
  init() {
    this.initMobileMenu();
    this.initRange();
    this.initSlider();
    this.showHide()
  }

  constructor() {}

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
        arrows: false,
        slidesToShow: 3,
        responsive: [
          {
            breakpoint: 1024,
            settings: {
              slidesToShow: 2,
              dots: true,
            }
          },
          {
            breakpoint: 480,
            settings: {
              slidesToShow: 1,
              dots: true,
            }
          },
        ]
      });
    })
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
}

const app = new App();
document.addEventListener('DOMContentLoaded', app.init());
