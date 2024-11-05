class Zombie {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 20;
        this.h = 35;
        this.xv = 1;
        this.yv = 1;
        this.speed = 2.5;
        this.color = 'red';
    }

    physics() {
        this.x += this.xv;
        this.y += this.yv;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }

    update() {
        this.physics();
    }
}