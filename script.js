document.addEventListener('DOMContentLoaded', () => {
    
    // *** 1. CONFIG: URL และ Field ID ***
    
    // ⚠️ แก้ไขแล้ว: ใช้ URL Web App ที่คุณให้มา ⚠️
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyt8C7tftX-qWM0EOIg1qhMj4VDFKdKfNezwFBqFbY/exec'; 
    
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfbqhpkecUg_ybrdvx8II20s-f_WCEu4H0BmbvJWgtBaMO5wA/formResponse'; 
    
    const FIELD_ID = {
        deskId: 'entry.1171635782',    
        seatId: 'entry.1575781351',     
    };
    // ***************************************************************
    
    const seats = document.querySelectorAll('.seat'); 
    const modal = document.getElementById('booking-modal');
    const closeButton = document.querySelector('.close-button');
    const bookingForm = document.getElementById('booking-form');
    const currentDeskInfo = document.getElementById('current-desk-info');
    let selectedSeat = null; 
    
    window.submitted = false; 

    // ฟังก์ชัน: อัปเดตสถานะที่นั่งตามข้อมูลที่ได้รับ
    const updateSeatStatus = (bookedSeatsData) => {
        const bookedMap = new Map();
        
        // สร้าง Map เพื่อหาข้อมูลได้เร็วขึ้น
        bookedSeatsData.forEach(item => {
            bookedMap.set(item.fullSeatId, item.name);
        });

        seats.forEach(seat => {
            const seatId = seat.getAttribute('data-seat-id'); // เช่น "1.1"

            if (bookedMap.has(seatId)) {
                // ที่นั่งถูกจองแล้ว
                const name = bookedMap.get(seatId);
                seat.setAttribute('data-status', 'booked');
                seat.setAttribute('title', `จองโดย: ${name}`);
            } else {
                // ที่นั่งว่าง
                seat.setAttribute('data-status', 'available');
                seat.setAttribute('title', 'ว่าง');
            }
        });
    };

    // ฟังก์ชัน: ดึงสถานะการจองทั้งหมดจาก Google Apps Script
    const fetchSeatStatus = async () => {
        try {
            // ดึงข้อมูลจาก Web App URL ที่คุณให้มา
            const response = await fetch(WEB_APP_URL, { method: 'GET' });
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            if (data.bookedSeats) {
                updateSeatStatus(data.bookedSeats);
                console.log('Seat status updated successfully.');
            } else {
                console.error("No bookedSeats data received.");
            }
        } catch (error) {
            console.error('Error fetching seat status:', error);
        }
    };

    // ----------------------------------------------------
    // เริ่มต้น: ดึงสถานะที่นั่งเมื่อโหลดหน้าเว็บ
    // ----------------------------------------------------
    fetchSeatStatus(); 


    // ฟังก์ชันจัดการเมื่อการส่งข้อมูลสำเร็จ (ถูกเรียกจาก iframe ใน index.html)
    window.handleSuccessfulSubmission = function() {
        if (selectedSeat) {
            const name = document.getElementById('name').value.trim();
            const seatId = selectedSeat.getAttribute('data-seat-id');
            
            // อัปเดตสถานะการจองใน UI ทันที 
            selectedSeat.setAttribute('data-status', 'booked');
            selectedSeat.setAttribute('title', `จองโดย: ${name}`);
            
            alert(`🎉 การจองที่นั่งสำเร็จ!`);
            closeModal();
        }
    };


    // 1. จัดการการคลิกที่ที่นั่ง 
    seats.forEach(seat => {
        seat.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            if (seat.getAttribute('data-status') === 'booked') {
                alert('ที่นั่งนี้ถูกจองแล้ว! กรุณาเลือกที่นั่งอื่น');
                return;
            }
            try {
                selectedSeat = seat;
                const seatId = selectedSeat.getAttribute('data-seat-id'); 
                const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id'); 

                currentDeskInfo.textContent = `โต๊ะที่ ${deskId} ตำแหน่ง ${seatId}`;
                modal.style.display = 'block';

            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการดึงข้อมูลโต๊ะ/ที่นั่ง:", error);
                alert("ไม่สามารถเปิดฟอร์มจองได้");
            }
        });
    });

    const closeModal = () => {
        modal.style.display = 'none';
        bookingForm.reset(); 
        selectedSeat = null;
    };

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // 2. จัดการการส่งฟอร์มจอง
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        if (selectedSeat) {
            const seatId = selectedSeat.getAttribute('data-seat-id');
            const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id');
            
            // ลบ Hidden Inputs เก่า และสร้างใหม่สำหรับ DeskID และ SeatID เท่านั้น
            document.querySelectorAll('#booking-form input[type="hidden"]').forEach(el => el.remove());

            // Input สำหรับ DeskID
            const hiddenDeskId = document.createElement('input');
            hiddenDeskId.type = 'hidden';
            hiddenDeskId.name = FIELD_ID.deskId;
            hiddenDeskId.value = deskId;
            bookingForm.appendChild(hiddenDeskId);
            
            // Input สำหรับ SeatID
            const hiddenSeatId = document.createElement('input');
            hiddenSeatId.type = 'hidden';
            hiddenSeatId.name = FIELD_ID.seatId;
            hiddenSeatId.value = seatId;
            bookingForm.appendChild(hiddenSeatId);

            // 2. ตั้งค่า Form เพื่อส่งข้อมูล
            bookingForm.action = GOOGLE_FORM_URL;
            bookingForm.method = 'POST';
            bookingForm.target = 'hidden_iframe';
            
            // 3. สั่งให้ Form ส่งข้อมูล
            window.submitted = true;
            
            setTimeout(() => {
                bookingForm.submit(); 
            }, 50);
        }
    });
});
