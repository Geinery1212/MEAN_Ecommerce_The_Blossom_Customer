import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GLOBAL } from 'src/app/services/GLOBA';
import { GuestService } from 'src/app/services/guest.service';
declare var $: any;
declare var iziToast: any;
import { io } from "socket.io-client";

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {

  public carrito_arr: Array<any> = [];
  public carrito_logout: Array<any> = [];
  public url = GLOBAL.url;

  public geo: any = {};
  public country = '';
  public currency = 'MXN';
  public token = localStorage.getItem('token')

  public user: any = undefined;
  public user_lc: any = undefined;
  public subtotal = 0;
  public precio_envio = 0;
  public socket = io(GLOBAL.socket);

  public total_pagar = 0;
  public subtotal_const = 0;
  public config = {
    monto_min_mxn: 0
  };

  constructor(
    private _guestService: GuestService,
    private _router: Router
  ) {
    let lc_geo: any = localStorage.getItem('geo');
    this.geo = JSON.parse(lc_geo);
    this.country = this.geo.country_name;
    this.currency = this.geo.currency;

    if (this.token) {
      let obj_lc: any = localStorage.getItem('user_data');
      this.user_lc = JSON.parse(obj_lc);
      this.obtener_carrito();
    }

    if (this.user_lc == undefined) {
      let ls_cart = localStorage.getItem('cart');
      if (ls_cart != null) {
        this.carrito_logout = JSON.parse(ls_cart);
        this._guestService.obtener_config_admin().subscribe(
          response => {
            this.config = response.data;
            this.calcular_carrito();
          }
        );
      } else {
        this.carrito_logout = [];
      }

    }


  }

  ngOnInit(): void {
    this._guestService.obtener_config_admin().subscribe(
      response => {
        this.config = response.data;
        this.calcular_carrito();
      }
    );
  }

  calcular_carrito() {
    this.subtotal = 0;
    if (this.user_lc != undefined) {
      if (this.currency == 'MXN') {
        this.carrito_arr.forEach(element => {
          let sub_precio = parseInt(element.producto.precio) * parseInt(element.cantidad);
          this.subtotal = this.subtotal + sub_precio;
        });
      }
    } else if (this.user_lc == undefined) {
      if (this.currency == 'MXN') {
        this.carrito_logout.forEach(element => {
          let sub_precio = parseInt(element.producto.precio) * parseInt(element.cantidad);
          this.subtotal = this.subtotal + sub_precio;
        });
      }
    }
    this.subtotal_const = this.subtotal;
    console.log(this.subtotal);
    if (this.config.monto_min_mxn >= this.subtotal) {
      this.precio_envio = this.config.monto_min_mxn;
      this.total_pagar = this.subtotal_const + this.precio_envio;
    } else {
      this.total_pagar = this.subtotal_const;
      this.precio_envio = 0
    }
  }

  eliminar_item_guest(item: any) {
    this.total_pagar = 0;
    this.carrito_logout.splice(item._id, 1);
    localStorage.removeItem('cart');
    if (this.carrito_logout.length >= 1) {
      localStorage.setItem('cart', JSON.stringify(this.carrito_logout));
    }
    if (this.currency == 'MXN') {
      let monto = item.producto.precio * item.cantidad;
      this.subtotal = this.subtotal - monto;
    }
    this.subtotal_const = this.subtotal;
  }

  obtener_carrito() {
    this._guestService.obtener_carrito_cliente(this.user_lc._id, this.token).subscribe(
      response => {
        this.carrito_arr = response.data;
        this._guestService.obtener_config_admin().subscribe(
          response => {
            this.config = response.data;
            this.calcular_carrito();
          }
        );
      }
    );
  }

  eliminar_item(id: any) {
    this.total_pagar = 0;
    this._guestService.eliminar_carrito_cliente(id, this.token).subscribe(
      response => {
        iziToast.show({
          title: 'SUCCESS',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Se eliminó el producto correctamente.'
        });
        this.socket.emit('delete-carrito', { data: response.data });
        this.obtener_carrito();

      }
    );
  }
}
