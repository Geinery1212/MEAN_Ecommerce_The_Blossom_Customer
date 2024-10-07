//import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GLOBAL } from 'src/app/services/GLOBA';
import { GuestService } from 'src/app/services/guest.service';
declare var $: any;
declare var iziToast: any;
declare var paypal: any;

interface HtmlInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  @ViewChild('paypalButton', { static: true }) paypalElement: ElementRef;

  public direcciones: Array<any> = [];
  public token = localStorage.getItem('token');
  public load_data = false;
  public direccion: any = {
    pais: 'México',
    principal: false,
    cliente: localStorage.getItem("_id")
  };

  public geo: any = {};
  public country = '';
  public currency = 'México';

  public carrito_arr: Array<any> = [];
  public user_lc: any = undefined;
  public subtotal = 0;
  public envio = 0;
  public total_pagar = 0;
  public url = GLOBAL.url;

  public direccion_envio: any = undefined;
  public metodo_pago = '';
  public btn_load = false;

  /***************************** */

  public venta: any = {};
  public dventa: Array<any> = [];
  public nota = '';
  public tipo_descuento = undefined;
  public valor_descuento = 0;

  /***************************** */

  public descuento = 0;
  public total_pagar_const = 0;
  public config: any = {};
  public envio_gratis = false;

  constructor(
    private _guestService: GuestService,
    private _router: Router
  ) {

    let obj_lc: any = localStorage.getItem('user_data');
    this.user_lc = JSON.parse(obj_lc);
    let lc_geo: any = localStorage.getItem('geo');
    this.geo = JSON.parse(lc_geo);
    this.country = this.geo.country_name;
    this.currency = this.geo.currency;
  }

  ngOnInit(): void {
    this.obtener_direccion();
    this.obtener_carrito();

    this._guestService.obtener_config_admin().subscribe(
      response => {
        this.config = response.data;
      }
    );



    setTimeout(() => {
      $('.contpaypal').addClass('ocultar-paypal');
    }, 150);


    paypal.Buttons({
      style: {
        layout: 'horizontal',
        tagline: true
      },

      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            description: 'Pago en mi tienda',
            amount: {
              currency_code: 'MXN',
              value: this.total_pagar
            },
          }]
        });

      },
      onApprove: async (data: any, actions: any) => {
        const order = await actions.order.capture();
        console.log(order);

        this.venta.transaccion = order.purchase_units[0].payments.captures[0].id;
        this.venta.currency = 'MXN';
        this.venta.subtotal = this.subtotal;
        this.venta.total_pagar = this.total_pagar;
        this.venta.envio_precio = this.envio;
        this.venta.detalles = this.dventa;
        this.venta.metodo_pago = 'Paypal';
        this.venta.nota = this.nota;
        this.venta.direccion = this.direccion_envio._id;
        this.venta.tipo_descuento = this.tipo_descuento;
        this.venta.valor_descuento = this.valor_descuento;
        let idcliente = localStorage.getItem('_id');
        this.venta.cliente = idcliente;

        this.btn_load = true;
        this._guestService.registro_compra_cliente(this.venta, this.token).subscribe(
          response => {
            this.btn_load = false;
            this._router.navigate(['/cuenta/pedidos/' + response.data._id]);
          },
          error => {
            console.log(error);

          }
        );

      },
      onError: (err: any) => {

      },
      onCancel: function (data: any, actions: any) {

      }
    }).render(this.paypalElement.nativeElement);
  }

  obtener_direccion() {
    this._guestService.obtener_direccion_todos_cliente(localStorage.getItem('_id'), this.token).subscribe(
      response => {
        this.direcciones = response.data;
        this.load_data = false;
      }
    );
  }

  registrar(registroForm: any) {
    if (registroForm.valid) {
      console.log(this.direccion);
      this._guestService.registro_direccion_cliente(this.direccion, this.token).subscribe(
        response => {
          this.direccion = {
            principal: false,
          };
          this.obtener_direccion();
          iziToast.show({
            title: 'SUCCESS',
            titleColor: '#1DC74C',
            color: '#FFF',
            class: 'text-success',
            position: 'topRight',
            message: 'Se agregó la nueva direccion correctamente.'
          });
        }
      );

    } else {
      iziToast.show({
        title: 'ERROR',
        titleColor: '#FF0000',
        color: '#FFF',
        class: 'text-danger',
        position: 'topRight',
        message: 'Los datos del formulario no son validos'
      });
    }
  }

  obtener_carrito() {
    this._guestService.obtener_carrito_cliente(this.user_lc._id, this.token).subscribe(
      response => {
        this.carrito_arr = response.data;
        this.carrito_arr.forEach(element => {
          if (this.currency == 'MXN') {
            this.dventa.push({
              producto: element.producto._id,
              subtotal: element.producto.precio,
              variedad: element.variedad._id,
              cantidad: element.cantidad,
              cliente: localStorage.getItem('_id')
            });
          }
        });
        this.calcular_carrito();
      }
    );
  }

  calcular_carrito() {
    this.subtotal = 0;
    if (this.currency == 'MXN') {
      this.carrito_arr.forEach(element => {
        let sub_precio = parseInt(element.producto.precio) * element.cantidad;
        this.subtotal = this.subtotal + sub_precio;
      });
    }

    this.total_pagar = this.subtotal;
    this.total_pagar_const = this.subtotal;
  }

  select_direccion_envio(item: any) {
    this.envio_gratis = false;
    this.direccion_envio = item;
    if (this.currency == 'MXN') {
      if (this.total_pagar_const >= this.config.monto_min_mxn) {
        this.envio = 0;
        this.envio_gratis = true;
      } else {
        this.envio = this.config.monto_min_mxn;
      }
    }

    if (this.venta.cupon != undefined) {
      this.total_pagar = (this.total_pagar_const - this.descuento) + this.envio;
    } else {
      this.total_pagar = this.total_pagar_const + this.envio;
    }
    if (this.currency == 'MXN') {
      if (this.direccion_envio != undefined) {
        if (this.carrito_arr.length >= 1) {
          setTimeout(() => {
            console.log('remove');
            $('.contpaypal').removeClass('ocultar-paypal');
          }, 100);
        }
      }
    }
  }

  generar_pedido(tipo: any) {
    this.venta.transaccion = 'Venta pedido';
    if (this.currency == 'MXN') {
      this.venta.currency = 'MXN';
    }
    this.venta.subtotal = this.subtotal;
    this.venta.total_pagar = this.total_pagar;
    this.venta.envio_precio = this.envio;
    this.venta.detalles = this.dventa;
    this.venta.metodo_pago = this.metodo_pago;
    this.venta.nota = this.nota;
    this.venta.direccion = this.direccion_envio._id;
    this.venta.tipo_descuento = this.tipo_descuento;
    this.venta.valor_descuento = this.valor_descuento;
    let idcliente = localStorage.getItem('_id');
    this.venta.cliente = idcliente;
    console.log(this.venta);

    this.btn_load = true;
    this._guestService.pedido_compra_cliente(this.venta, this.token).subscribe(
      response => {
        console.log(response);

        if (response.venta != undefined) {
          this.btn_load = false;
          this._router.navigate(['/cuenta/pedidos', response.venta._id]);
        } else {
          iziToast.show({
            title: 'ERROR',
            titleColor: '#FF0000',
            color: '#FFF',
            class: 'text-danger',
            position: 'topRight',
            message: response.message
          });
          this.btn_load = false;
        }
      }
    );
  }


  validar_cupon() {

    if (this.venta.cupon) {
      if (this.venta.cupon.toString().length <= 25) {

        this._guestService.validar_cupon_admin(this.venta.cupon, this.token).subscribe(
          response => {
            console.log(response);

            if (response.data != undefined) {
              this.tipo_descuento = response.data.tipo;

              if (response.data.disponibilidad == 'México') {
                if (this.currency == 'MXN') {
                  if (response.data.tipo == 'Valor fijo') {
                    this.descuento = response.data.valor;
                    this.valor_descuento = this.descuento;
                    this.total_pagar = (this.total_pagar_const - this.descuento) + this.envio;
                  } else if (response.data.tipo == 'Porcentaje') {
                    this.descuento = Math.round((this.total_pagar_const * response.data.valor) / 100);
                    this.valor_descuento = this.descuento;
                    this.total_pagar = (this.total_pagar_const - this.descuento) + this.envio;
                  }
                  // this.select_direccion_envio(this.direccion_envio);
                } else {
                  iziToast.show({
                    title: 'ERROR',
                    titleColor: '#ff0000',
                    color: '#FFF',
                    class: 'text-success',
                    position: 'topRight',
                    message: 'El cupón no es valido para tu país'
                  });
                }
              }

            } else {
              iziToast.show({
                title: 'ERROR',
                titleColor: '#ff0000',
                color: '#FFF',
                class: 'text-success',
                position: 'topRight',
                message: response.message
              });
            }
          }
        );
      } else {
        iziToast.show({
          title: 'ERROR',
          titleColor: '#ff0000',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'El cupon debe ser menos de 25 caracteres.'
        });
      }
    } else {
      iziToast.show({
        title: 'ERROR',
        titleColor: '#ff0000',
        color: '#FFF',
        class: 'text-success',
        position: 'topRight',
        message: 'El cupon no es valido.'
      });

    }
  }


}
