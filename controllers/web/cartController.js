const productModel = require("../../models/productModel");
const cateModel = require('../../models/categoryModel');
const cartModel = require('../../models/cartModel');
const nodemailer = require("nodemailer");
// const sendEmail = require('../../config/sendmail')

// const sendMail = (tomail, tieude, noidung) => {
//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//             user: 'lilalila145236@gmail.com',
//             pass: 'gmail145236'
//         }
//     });

//     const mailOptions = {
//         from: 'lilalila145236@gmail.com', // sender address
//         to: tomail,
//         subject: tieude, // Subject line
//         html: noidung
//     }
//     console.log(noidung);
//     transporter.sendMail(mailOptions, function(error, info) {
//         if (err) {
//             console.log(error);
//         } else {
//             console.log('Email sent: ' + info.response)
//         }
//     })
// }

// require('buffer');
let cartPage = {
    cart: "cart",
    checkout: "checkout"
}
let addToCart = async(req, res) => {
    let slug = req.params.slug;
    let product = await productModel.findOne({ slug: slug });
    if (req.session.cart == undefined) {
        req.session.cart = [];
        req.session.cart.push({
            name: product.name,
            slug: product.slug,
            price: product.price,
            qty: 1,
            total: product.price * 1
        })
    } else {
        let cart = req.session.cart;
        let newItem = true;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].slug == slug) {
                newItem = false;
                cart[i].qty++;
                cart[i].total = cart[i].price * cart[i].qty;
                break;
            }
        }
        if (newItem) {
            req.session.cart.push({
                name: product.name,
                slug: product.slug,
                price: product.price,
                image: product.image,
                qty: 1,
                total: product.price * 1
            })
        }
    }
    req.flash('success', 'Th??m v??o gi??? th??nh c??ng');
    return res.redirect('/checkout');
}

let getCart = async(req, res) => {
    try {

        let loggedIn = (req.isAuthenticated()) ? true : false
        if (req.session.cart == undefined) {
            lengthCart = 0;
        } else {
            lengthCart = req.session.cart.length;
        };
        user = res.locals.user;
        let cart = req.session.cart;
        let name = "";
        let email = "";
        let phone = "";
        let address = "";
        let note = "";
        if (loggedIn) {
            name = user.name;
            email = user.email;
            phone = user.phone;
            address = user.address;
        }
        console.log(loggedIn);
        console.log(res.locals.user)

        let total = 0;
        if (cart != undefined) {
            for (let i = 0; i < cart.length; i++) {
                total += cart[i].total;
            }
        }
        let cates = await cateModel.find();
        return res.render('web/layout/master', {
            content: cartPage.checkout,
            data: {
                cart: cart,
                cates: cates,
                total: total,
                lengthCart: lengthCart,
            },
            name: name,
            email: email,
            phone: phone,
            address: address,
            note: note,
            title: "Gi??? h??ng"
        })
    } catch (error) {
        return res.status(500).json({
            type: "Error",
            msg: error
        })
    }
}

let getUpdateQty = async(req, res) => {
    try {
        if (req.session.cart == undefined) {
            lengthCart = 0;
        } else {
            lengthCart = req.session.cart.length;
        };
        let slug = req.params.slug;
        let cart = req.session.cart;
        // let total = 0;
        // if (cart != undefined) {
        //     for (let i = 0; i < cart.length; i++) {
        //         total += cart[i].total;
        //     }
        // }
        let cates = await cateModel.find();

        let action = req.query.action;

        for (let i = 0; i < cart.length; i++) {
            if (cart[i].slug == slug) {
                switch (action) {
                    case "add":
                        cart[i].qty++;
                        cart[i].total = cart[i].price * cart[i].qty;
                        break;
                    case "remove":
                        cart[i].qty--;
                        cart[i].total = cart[i].price * cart[i].qty;
                        if (cart[i].qty < 1) cart.splice(i, 1);
                        break;
                    case "clear":
                        cart.splice(i, 1);
                        if (cart.length == 0) delete req.session.cart;
                        break;
                    default:
                        console.log('update problem');
                        break;
                }
                break;
            }
        }

        req.flash('success', 'C???p nh???t gi??? h??ng th??nh c??ng!');
        return res.redirect('back');
    } catch (error) {
        return res.status(500).json({
            type: "Error",
            msg: error
        })
    }
}

let postCart = async(req, res) => {
    try {
        let loggedIn = (req.isAuthenticated()) ? true : false
        user = res.locals.user;
        let cart = req.session.cart;
        let param = req.body;
        let total = 0;
        if (cart != undefined) {
            for (let i = 0; i < cart.length; i++) {
                total += cart[i].total;
            }
        }

        let name = param.name;
        let phone = param.phone;
        let address = param.address;
        let email = param.email;

        if (cart == undefined) {
            req.flash('error', 'Gi??? h??ng ??ang tr???ng! Vui l??ng th??m s???n ph???m ????? ?????t h??ng');
            return res.redirect("back")
        } else {
            let mailgh = "<h1 align='center'>Th??ng tin ????n h??ng</h1>"
            mailgh = mailgh + "<p>H??? t??n: " + name + "</p>";
            mailgh = mailgh + "<p>?????a ch??? giao h??ng: " + address + "</p>";
            mailgh = mailgh + "<p>Email: " + email + "</p>";
            mailgh = mailgh + "<p>S??? ??i???n tho???i: " + phone + "</p>";
            mailgh = mailgh + "<table width='80%' cellspacing='0' cellpadding='2' boder='1'>"
            mailgh = mailgh + "<tr><td width='10%'>STT</td><td width='30%'>T??n gi??y</td><td width='10%'>S??? l?????ng</td><td width='15%'>????n gi??</td><td>Th??nh ti???n</td></tr>";
            var stt = 1;
            var tongtien = 0;
            for (let i = 0; i < cart.length; i++) {
                mailgh = mailgh + "<tr><td>" + stt + "</td><td>" + cart[i].name + "</td><td>" + cart[i].qty + "</td><td>" + cart[i].price + "</td><td>" + cart[i].total + "</td></tr>";
                stt++;
                tongtien = tongtien + cart[i].qty * cart[i].price;
            }
            mailgh = mailgh + "<tr><td colspan='6' align='right'>T???ng ti???n: " + tongtien + "</td></tr></table>";
            mailgh = mailgh + "<p>C???m ??n qu?? kh??ch ???? ?????t h??ng, ????n h??ng s??? chuy???n ?????n qu?? kh??ch trong th???i gian s???m nh???t</p>";
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: 'lilalila145236@gmail.com',
                    pass: 'gmail145236'
                }
            });

            const mailOptions = {
                from: 'lilalila145236@gmail.com', // sender address
                to: email,
                subject: '????n h??ng gi??y t??? USS - Ultra Sneaker Store', // Subject line
                text: 'C???m ??n qu?? kh??ch ???? ?????t h??ng, ????n h??ng s??? chuy???n ?????n qu?? kh??ch trong th???i gian s???m nh???t',
                html: mailgh
            }
            transporter.sendMail(mailOptions, function(error, info) {
                if (err) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response)
                }
            })
            let data = {
                infoProduct: req.session.cart,
                infoCustomer: param,
                total: total
            }
            await cartModel.create(data);

            delete req.session.cart;
            req.flash('success', '?????t h??ng th??nh c??ng!');
            return res.redirect("/checkout")
        }

    } catch (error) {
        return res.status(500).json({
            type: 'Error',
            msg: error
        })
    }
}

let clearCart = async(req, res) => {
    try {
        delete req.session.cart;
        req.flash('success', 'X??a gi??? h??ng th??nh c??ng!');
        return res.redirect('/checkout');
    } catch (error) {
        return res.status(500).json({
            type: "Error",
            msg: error
        })
    }
}

module.exports = {
    addToCart: addToCart,
    getCart: getCart,
    postCart: postCart,
    getUpdateQty: getUpdateQty,
    clearCart: clearCart
}