import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Header } from "../../components/header/header";
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { OrderResponse } from '../../models/order.model';
import { ProductService } from '../../services/product.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { toDate } from '../../utils/date.util';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-my-order',
  imports: [FormsModule, Header, RouterLink, MatIcon, DatePipe, CurrencyPipe, MatProgressSpinnerModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './my-order.html',
  styleUrl: './my-order.css',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MyOrder implements OnInit {
  orders = signal<OrderResponse[]>([])
  router = inject(Router);
  toastr = inject(ToastrService);
  productService = inject(ProductService);
  isLoading = signal<boolean>(false);
  dateInput = signal<string | null>(null)
  startDate = signal<Date | null>(null)
  endDate = signal<Date | null>(null)

  today: Date = new Date();

  filteredOrders = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    const orders = this.orders();

    if (!start && !end) return orders;

    const startTime = start
      ? new Date(start).setHours(0, 0, 0, 0)
      : null;

    const endTime = end
      ? new Date(end).setHours(23, 59, 59, 999)
      : null;

    return orders.filter(order => {
      const orderTime = new Date(order.createdAt).getTime();

      if (startTime && !endTime) {
        return orderTime >= startTime;
      }

      if (!startTime && endTime) {
        return orderTime <= endTime;
      }
      
      return (
        orderTime >= startTime! &&
        orderTime <= endTime!
      );
    });
  });

  clearRange() {
    this.startDate.set(null);
    this.endDate.set(null);
  }
  onNavigateTo(id: string) {
    this.toastr.info('Items added to your cart.')
    this.router.navigate(['/order-repeat', id])
  }

  totalSpent = computed(() =>
    this.orders().reduce((acc, obj) => (acc + obj.totalAmount), 0)
  );

  ngOnInit(): void {
    this.isLoading.set(true);
    const token = localStorage.getItem('token');
    this.productService.getOrders(token as string).subscribe({
      next: orders => {
        // console.log(orders);
        this.orders.set(orders)
        this.isLoading.set(false);
      },
      error: err => {
        console.log(err)
        this.isLoading.set(false)
      }
    })
  }

}
