import { Component, OnInit } from '@angular/core';
import { GuestService } from 'src/app/services/guest.service';
declare var iziToast: any;
declare var $: any;

@Component({
  selector: 'app-direcciones',
  templateUrl: './direcciones.component.html',
  styleUrls: ['./direcciones.component.css']
})
export class DireccionesComponent implements OnInit {

  public geo: any = {};
  public country = '';
  public currency = 'MXN';

  public token = localStorage.getItem('token');
  public direccion: any = {
    pais: 'México',
    estado: '',
    municipio: '',
    principal: false
  };
  public direcciones: Array<any> = [];
  public load_data = true;
  public op = 1;

  constructor(
    private _guestService: GuestService
  ) {
    let lc_geo: any = localStorage.getItem('geo');
    this.geo = JSON.parse(lc_geo);
    this.country = this.geo.country_name;
    this.currency = this.geo.currency;
  }

  ngOnInit(): void {
    this.obtener_direccion();
  }

  registrar(registroForm: any) {
    if (registroForm.valid) {
      let data = {
        cliente: localStorage.getItem('_id'),
        nombres: this.direccion.nombres,
        apellidos: this.direccion.apellidos,
        dni: this.direccion.dni,
        telefono: this.direccion.telefono,
        pais: this.direccion.pais,
        estado: this.direccion.estado,
        municipio: this.direccion.municipio,
        direccion: this.direccion.direccion,
        referencia: this.direccion.referencia,
        zip: this.direccion.zip,
        principal: this.direccion.principal
      }

      console.log(data);
      this._guestService.registro_direccion_cliente(data, this.token).subscribe(
        response => {
          this.direccion = {
            pais: 'México',
            estado: '',
            municipio: '',
            principal: false
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

  obtener_direccion() {
    this._guestService.obtener_direccion_todos_cliente(localStorage.getItem('_id'), this.token).subscribe(
      response => {
        this.direcciones = response.data;
        this.load_data = false;
      }
    );
  }


  establecer_principal(id: any) {
    this._guestService.cambiar_direccion_principal_cliente(id, localStorage.getItem('_id'), this.token).subscribe(
      response => {
        iziToast.show({
          title: 'SUCCESS',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Se actualizó la direccion principal.'
        });
        this.obtener_direccion();
      }
    );
  }

  eliminar(id: any) {
    this._guestService.eliminar_direccion_cliente(id, this.token).subscribe(
      response => {
        iziToast.show({
          title: 'SUCCESS',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Se eliminó la dirección correctamente.'
        });
        this.obtener_direccion();

      },
      error => {
        console.log(error);

      }
    )
  }

  changeOp(op: any) {
    this.op = op;
  }
}
