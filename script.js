document.addEventListener('DOMContentLoaded', () => {
    
    // *** 1. CONFIG: Field ID ที่ถูกต้อง 100% สำหรับ Google Form ของคุณ ***
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfbqhpkecUg_ybrdvx8II20s-f_WCEu4H0BmbvJWgtBaMO5wA/formResponse'; 
    
    const FIELD_ID = {
        name: 'entry.2119879183',      
        nickname: 'entry.1744498140',  
        classRoom: 'entry.1296537747', 
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
    
    // สถานะสำหรับ iframe เพื่อตรวจสอบว่า Form ถูก Submit แล้ว
    window.submitted = false; 

    // ฟังก์ชันจัดการเมื่อการส่งข้อมูลสำเร็จ (ถูกเรียกจาก iframe ใน index.html)
    window.handleSuccessfulSubmission = function() {
        if (selectedSeat) {
            const name = document.getElementById('name').value.trim();
            const nickname = document.getElementById('nickname').value.trim();
            const seatId = selectedSeat.getAttribute('data-seat-id');
            const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id');
            const classRoom = document.getElementById('class-room').value.trim();
            
            // อัปเดตสถานะการจองใน UI (สีแดง)
            selectedSeat.setAttribute('data-status', 'booked');
            selectedSeat.setAttribute('title', `จองโดย: ${name} (${nickname}), ${classRoom}`);
            
            alert(`🎉 การจองที่นั่ง โต๊ะที่ ${deskId} ตำแหน่ง ${seatId} สำเร็จ! ข้อมูลถูกบันทึกใน Google Sheet แล้ว.`);
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

    // 2. จัดการการส่งฟอร์มจอง (ใช้เทคนิค iframe เพื่อรับประกันการส่งข้อมูล)
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault(); 

        if (selectedSeat) {
            const name = document.getElementById('name').value.trim();
            const nickname = document.getElementById('nickname').value.trim();
            const classRoom = document.getElementById('class-room').value.trim();
            const seatId = selectedSeat.getAttribute('data-seat-id');
            const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id');
            
            // 1. ล้าง/สร้าง องค์ประกอบ Input Hidden เพื่อส่งข้อมูล DeskID และ SeatID
            document.querySelectorAll('#booking-form input[type="hidden"]').forEach(el => el.remove());

            // Input สำหรับ ชื่อจริง
            const hiddenName = document.createElement('input');
            hiddenName.type = 'hidden';
            hiddenName.name = FIELD_ID.name;
            hiddenName.value = name;
            bookingForm.appendChild(hiddenName);

            // Input สำหรับ ชื่อเล่น
            const hiddenNickname = document.createElement('input');
            hiddenNickname.type = 'hidden';
            hiddenNickname.name = FIELD_ID.nickname;
            hiddenNickname.value = nickname;
            bookingForm.appendChild(hiddenNickname);

            // Input สำหรับ ชั้น/ห้อง
            const hiddenClassRoom = document.createElement('input');
            hiddenClassRoom.type = 'hidden';
            hiddenClassRoom.name = FIELD_ID.classRoom;
            hiddenClassRoom.value = classRoom;
            bookingForm.appendChild(hiddenClassRoom);

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


            // 2. ตั้งค่า Form ให้ส่งข้อมูลไปที่ Google Form และให้ iframe รับ Response
            bookingForm.action = GOOGLE_FORM_URL;
            bookingForm.method = 'POST';
            bookingForm.target = 'hidden_iframe';
            
            // 3. ตั้งค่าสถานะว่ากำลังจะส่ง และสั่งให้ Form ส่งข้อมูล
            window.submitted = true;
            
            // ใช้ setTimeout เพื่อให้แน่ใจว่า DOM ได้ถูกอัปเดตก่อนการส่ง
            setTimeout(() => {
                bookingForm.submit(); 
            }, 50);

            // ไม่ต้องทำอะไรต่อในนี้ เพราะ handleSuccessfulSubmission() จะถูกเรียกเมื่อ iframe โหลดเสร็จ
        }
    });
});
