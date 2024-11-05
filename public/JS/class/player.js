class Player {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.xv = 0;
        this.yv = 0;
        this.color = 'blue';
        this.dead = false;
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
        //console.log(this.x, this.y, this.color);
    }
}