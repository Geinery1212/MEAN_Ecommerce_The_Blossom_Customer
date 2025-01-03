import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { GuestService } from 'src/app/services/guest.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  public config_global : any = {};

  public geo : any = {};
  public country = '';
  public currency = 'PEN';
  public categorias :Array<any> = [];
  public activeLang = 'es';

  constructor(

    private _router:Router,
    private translate: TranslateService,
    private _guestService:GuestService
  ) {
    let lc_geo :any= localStorage.getItem('geo');
    this.geo = JSON.parse(lc_geo);
    this.country = this.geo.country_name;
    this.currency = this.geo.currency;
    this.translate.setDefaultLang(this.activeLang);
  }

  ngOnInit(): void {
    this._guestService.listar_categorias_publico().subscribe(
      response=>{
        this.categorias = response.data;
      }
    );
  }

  public cambiarLenguaje() {

    this.translate.use(this.activeLang);
  }

}
