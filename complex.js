function Complex(re, im) {
    this.re = re;
    this.im = im || 0.0;
}
Complex.prototype.add = function (other, dst) {
    dst.re = this.re + other.re;
    dst.im = this.im + other.im;
    return dst;
}
Complex.prototype.sub = function (other, dst) {
    dst.re = this.re - other.re;
    dst.im = this.im - other.im;
    return dst;
}
Complex.prototype.mul = function (other, dst) {
    //cache re in case dst === this
    var r = this.re * other.re - this.im * other.im;
    dst.im = this.re * other.im + this.im * other.re;
    dst.re = r;
    return dst;
}
Complex.prototype.cexp = function (dst) {
    var er = Math.exp(this.re);
    dst.re = er * Math.cos(this.im);
    dst.im = er * Math.sin(this.im);
    return dst;
}

Complex.prototype.magnitude = function () {
    return Math.sqrt(this.re * this.re + this.im * this.im);
}