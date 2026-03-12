class Menu {
  constructor() {
    this.screen = document.getElementById('menu-screen');
    this.menuBtn = document.getElementById('activity-menu-btn');
    this.activeActivity = null;

    // Activity instances (game is already created globally)
    this.timer = new CountdownTimer();

    // Menu button clicks
    this.screen.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.launch(btn.dataset.activity);
      });
    });

    // Corner menu button returns to menu
    this.menuBtn.addEventListener('click', () => this.returnToMenu());
  }

  launch(activity) {
    this.screen.classList.remove('active');
    this.menuBtn.style.display = '';
    this.activeActivity = activity;

    if (activity === 'wire-defusal') {
      game.show();
    } else if (activity === 'countdown-timer') {
      this.timer.show(game.audio);
    }
  }

  returnToMenu() {
    this.menuBtn.style.display = 'none';

    if (this.activeActivity === 'wire-defusal') {
      game.hide();
    } else if (this.activeActivity === 'countdown-timer') {
      this.timer.hide();
    }

    this.activeActivity = null;
    this.screen.classList.add('active');
  }
}

// Initialize
const menu = new Menu();
