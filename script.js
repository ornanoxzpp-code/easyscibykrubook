document.addEventListener('DOMContentLoaded', () => {
    
    // *** CONFIG: Google Form URL และ Field ID ***
    
    // โค้ดนี้ถูกปรับให้ส่งข้อมูลอย่างเดียว ไม่มีการดึงสถานะกลับมา 
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfbqhpkecUg_ybrdvx8II20s-f_WCEu4H0BmbvJWgtBaMO5wA/formResponse'; 
    
    const FIELD_ID = {
        deskId: 'entry.1171635782',    
        seatId: 'entry.1575781351',     
    };
    // ********************************************
    
    const seats = document.querySelectorAll('.seat'); 
    const modal = document.getElementById('booking-modal');
    const closeButton = document.querySelector('.close-button');
    const bookingForm = document.getElementById('booking-form');
    const currentDeskInfo = document.getElementById('current-desk-info');
    let selectedSeat = null; 
    
    window.submitted = false; 

    // ฟังก์ชันจัดการเมื่อการส่งข้อมูลสำเร็จ (เมื่อ Pop-up Form หายไป)
    window.handleSuccessfulSubmission = function() {
        if (selectedSeat) {
            // **ยกเลิกการอัปเดตสถานะสีแดงใน JS** เพราะคุณจะทำใน HTML แทน
            
            alert(`🎉 การจองที่นั่งถูกบันทึกใน Google Sheet แล้ว!`);
            closeModal();
            
            // แนะนำให้ผู้ใช้รีเฟรชหรือไปแก้ไขสถานะใน HTML
            alert('⚠️ หมายเหตุ: สถานะสีแดงบนหน้าจอจะไม่เปลี่ยนจนกว่าคุณจะแก้ไขไฟล์ index.html และอัปโหลดใหม่');
        }
    };


    // 1. จัดการการคลิกที่ที่นั่ง
    seats.forEach(seat => {
        seat.addEventListener('click', (e) => {
            e.stopPropagation(); 
            
            // 🚨 การบล็อกการจองเกิดขึ้นที่นี่
            if (seat.getAttribute('data-status') === 'booked') {
                alert('ที่นั่งนี้ถูกจองแล้ว! กรุณาเลือกที่นั่งอื่น');
                return; // ⚠️ บรรทัดนี้คือตัวบล็อกการจอง!
            }
            // 🚨 จบการบล็อก

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
