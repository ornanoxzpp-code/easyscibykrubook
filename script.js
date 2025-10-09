document.addEventListener('DOMContentLoaded', () => {
    
    // *** CONFIG: Google Form URL และ Field ID ***
    
    // URL สำหรับส่งข้อมูล Google Form
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfbqhpkecUg_ybrdvx8II20s-f_WCEu4H0BmbvJWgtBaMO5wA/formResponse'; 
    
    const FIELD_ID = {
        deskId: 'entry.1171635782',    
        seatId: 'entry.1575781351',     
    };
    // ********************************************
    
    // เลือกองค์ประกอบทั้งหมดที่ใช้ในการทำงาน
    const seats = document.querySelectorAll('.seat'); 
    const modal = document.getElementById('booking-modal');
    const closeButton = document.querySelector('.close-button');
    const bookingForm = document.getElementById('booking-form');
    const currentDeskInfo = document.getElementById('current-desk-info');
    let selectedSeat = null; 
    
    // ตัวแปรสำหรับตรวจสอบสถานะการส่งฟอร์ม (ใช้กับ iframe)
    window.submitted = false; 

    // ฟังก์ชันจัดการเมื่อการส่งข้อมูลสำเร็จ (เมื่อ iframe โหลดเสร็จ)
    window.handleSuccessfulSubmission = function() {
        if (selectedSeat) {
            alert(`🎉 การจองที่นั่งถูกบันทึกใน Google Sheet แล้ว!`);
            closeModal();
            // แจ้งเตือนให้ทราบว่าต้องอัปเดตสถานะด้วยมือ
            alert('⚠️ การจองสำเร็จแล้ว แต่คุณต้องแก้ไขไฟล์ index.html และอัปโหลดใหม่ เพื่อให้ที่นั่งเปลี่ยนเป็นสีแดงและบล็อกการจองถาวร');
        }
    };


    // 1. จัดการการคลิกที่ที่นั่ง (ฟังก์ชันหลักที่เปิด/บล็อก Pop-up)
    seats.forEach(seat => {
        seat.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            // 🚨 การบล็อกการจอง: ถ้าสถานะเป็น booked จะเตือนและออกทันที
            if (seat.getAttribute('data-status') === 'booked') {
                alert('ที่นั่งนี้ถูกจองแล้ว! กรุณาเลือกที่นั่งอื่น');
                return; // บรรทัดนี้จะหยุดการทำงานทั้งหมด
            }
            
            // ถ้าไม่ใช่ booked (คือ available) ให้ดำเนินการเปิดฟอร์ม
            try {
                selectedSeat = seat;
                const seatId = selectedSeat.getAttribute('data-seat-id'); 
                const deskId = selectedSeat.closest('.desk').getAttribute('data-desk-id'); 

                // แสดงข้อมูลใน Pop-up และเปิด Modal
                currentDeskInfo.textContent = `โต๊ะที่ ${deskId} ตำแหน่ง ${seatId}`;
                modal.style.display = 'block';

            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการเปิดฟอร์ม:", error);
                alert("ไม่สามารถเปิดฟอร์มจองได้");
            }
        });
    });

    // ฟังก์ชันปิด Modal
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
            
            // ลบ Hidden Inputs เก่า และสร้างใหม่สำหรับ DeskID และ SeatID
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

            // ตั้งค่า Form เพื่อส่งข้อมูลผ่าน iframe
            bookingForm.action = GOOGLE_FORM_URL;
            bookingForm.method = 'POST';
            bookingForm.target = 'hidden_iframe';
            
            window.submitted = true;
            
            setTimeout(() => {
                bookingForm.submit(); 
            }, 50);
        }
    });
});
